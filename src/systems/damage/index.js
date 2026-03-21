'use strict';

import { CONFIG } from '../../config/constants.js';
import { rand, clamp } from '../../utils/math.js';
import { player, world, queueLog, triggerScram } from '../../state/sim-state.js';
import { session, setMsg, addLog, setCasualtyState, setTacticalState } from '../../state/session-state.js';
import { dcLog, COMP_STATION } from '../../narrative/comms.js';

// ── Sub-module imports ────────────────────────────────────────────────────
import {
  COMPS, COMP_DEF, ROOMS, ROOM_IDS, SECTION_ROOMS, SECTION_LABEL, SECTION_SHORT,
  SYS_DEF, SYS_LABEL, ALL_SYS, STATES, REPAIR_TIME, TRAVEL, HIGH_ENERGY_SYS,
  WTD_PAIRS, WTD_RC_KEYS, ROOM_ADJ, SECTION_SYSTEMS, DIESEL_SECTION_SYSTEMS,
  ROOM_SYSTEMS, EVAC_TO, SECTION_CAP,
  COMP_FRACS, COMP_LABELS,
  activeSystems, compLabel, roomSection, _sectionNoEvac,
} from './damage-data.js';

import {
  CREW_MANIFEST, buildCrewManifest, relocateCrewForWatch,
  totalFit, totalWounded, totalKilled, totalCrew, crewEfficiency, maxDCTeams,
} from './crew-roster.js';

import {
  _injureComp, _woundDcTeamMember, _findCrewById,
  _nextCasualty, _nextCasualtyComp, _tickMedical,
  _setCasualtyComms, _setDcLogFn,
} from './casualty.js';

import {
  _wtdTransitPenalty, _wtdFloodSpread,
  _emergencyCloseWTDs, _emergencyOpenWTDs,
  _tickWTDAutoOpen, _tickWTDAutoClose,
  toggleWTD, _floodComp, hitCompartment, canReachTower,
  _checkSinking, sealFlooding,
  applyDepthCascade, resetDepthCascade, applyHullStress,
  _setFloodingComms, _setFloodingPanel, _setFloodingHelpers,
} from './flooding.js';

import {
  igniteFire, _sectionFire, _sectionHasFire,
  _extinguishFire, _nitrogenDrench, _tickDrench, _tickFire,
  manualDrench, ventN2,
  _setFiresComms, _setFiresPanel, _setFiresHelpers, _setAssignTeamFn,
} from './fires.js';

import {
  _teamEffectiveness, teamAtComp,
  assignTeam, recallTeam,
  _canReachComp, _bestDCTarget, _triggerEmergencyMuster,
  _autoDispatchDC, _tickTeams,
  _setDcTeamsComms, _setDcTeamsHelpers,
} from './dc-teams.js';

import {
  effectiveState, getEffects, getTrimState, drawHPA,
  _setEffectsComms,
} from './effects.js';

const C = CONFIG;

// ── Lazy COMMS binding ────────────────────────────────────────────────────
let _COMMS = null;
export function _bindDamage(deps) {
  if(deps.COMMS){
    _COMMS=deps.COMMS;
    _setCasualtyComms(deps.COMMS);
    _setFloodingComms(deps.COMMS);
    _setFiresComms(deps.COMMS);
    _setDcTeamsComms(deps.COMMS);
    _setEffectsComms(deps.COMMS);
  }
}

// ── Lazy PANEL binding ────────────────────────────────────────────────────
let _PANEL = null;
export function _bindDamagePanel(deps) {
  if(deps.PANEL){
    _PANEL=deps.PANEL;
    _setFloodingPanel(deps.PANEL);
    _setFiresPanel(deps.PANEL);
  }
}

// ── Lazy _broadcastTransient binding ──────────────────────────────────────
let _broadcastTransient = null;
export function _bindDamageBroadcast(deps) { if(deps.broadcastTransient) _broadcastTransient=deps.broadcastTransient; }

// ── Set up dcLog for casualty module ──────────────────────────────────────
_setDcLogFn(dcLog);

// ── Alert helper ──────────────────────────────────────────────────────────
function _alert(text){ player.damage.alerts.push({text,t:5.0}); }

// ── System helpers ────────────────────────────────────────────────────────
function stateIndex(sys){ return STATES.indexOf(player.damage.systems[sys]); }
function damageSystem(sys,steps=1){
  const d=player.damage;
  const next=Math.min(stateIndex(sys)+steps,STATES.length-1);
  d.systems[sys]=STATES[next];
  // Primary coolant loss → automatic SCRAM
  if(sys==='primary_coolant'&&next>=2&&!player.scram&&typeof triggerScram==='function'){
    triggerScram('coolant');
    _COMMS?.reactor.scram('coolant');
  }
  return STATES[next];
}


// ── Return displaced crew when compartment clears ──────────────────────────
function _returnCrew(comp,d,cause='flood'){
  if(d._evacuated) d._evacuated[comp]=false;
  // Displaced crew from this section may have been physically moved to other sections.
  // Search all sections for crew whose original comp was here (stationComp) and are displaced.
  const returnees=[];
  for(const sec of COMPS){
    const evacuees=(d.crew[sec]||[]).filter(cr=>cr.displaced&&cr.status!=='killed'&&cr.stationComp===comp);
    for(const cr of evacuees){
      // Move them back to their home section
      d.crew[sec]=d.crew[sec].filter(c=>c!==cr);
      if(!d.crew[comp]) d.crew[comp]=[];
      cr.comp=comp;
      cr.displaced=false;
      d.crew[comp].push(cr);
      returnees.push(cr);
    }
  }
  // Also clear displaced flag for any who weren't physically moved (flood path)
  const inPlace=(d.crew[comp]||[]).filter(cr=>cr.displaced&&cr.status!=='killed');
  for(const cr of inPlace){ cr.displaced=false; returnees.push(cr); }
  if(!returnees.length) return;
  if(cause==='fire') _COMMS?.fire.crewReturn(SECTION_LABEL[comp], COMP_STATION[comp]||'ENG', returnees.length);
  else               _COMMS?.flood.crewReturn(SECTION_LABEL[comp], COMP_STATION[comp]||'ENG', returnees.length);
}

// ── Shared casualty-state clear check ────────────────────────────────────
// Called after any event that could end the emergency (fire out, vent complete, etc.)
function _checkClearEmergency(d){
  if(session?.casualtyState!=='emergency') return;
  const anyFire=ROOM_IDS.some(rid=>(d.fire[rid]||0)>0.01);
  // Check for active breaches (rooms still taking water), not just residual water level.
  // Emergency clears when all breaches are sealed — bilge pumps handle the rest.
  const anyFlood=ROOM_IDS.some(rid=>(d.roomFloodRate?.[rid]||0)>0);
  const anyTeamActive=Object.values(d.teams).some(t=>t.state!=='ready'&&t.state!=='lost');
  // Drenched compartments require venting before the emergency is truly controlled
  const anyDrenched=COMPS.some(s=>(d._fireDrench?.[s]?.level??0)>0);
  if(!anyFire&&!anyFlood&&!anyTeamActive&&!anyDrenched){
    setCasualtyState('normal');
    d._emergMusterFired=false;
    for(const t of Object.values(d.teams)){ t._autoMode=false; t._readyT=0; }
    const hadFlood=COMPS.some(s=>(d.flooded[s]||d.strikes[s]>0));
    _COMMS?.crewState.casualtyControlled(hadFlood?'flood':'fire');
    _emergencyOpenWTDs(d);
  }
}

// ── Wire up cross-module helpers ──────────────────────────────────────────
_setFloodingHelpers({ _alert, damageSystem, stateIndex, _floodComp });
_setFiresHelpers({
  _alert, damageSystem, _returnCrew, _checkClearEmergency,
  _teamEffectiveness, _woundDcTeamMember: _woundDcTeamMember, _canReachComp,
});
_setDcTeamsHelpers({
  _alert, _returnCrew, _checkClearEmergency,
  _woundDcTeamMember, _sectionHasFire, _sectionFire, _wtdTransitPenalty,
});
_setAssignTeamFn(assignTeam);

// ── Init ──────────────────────────────────────────────────────────────────
function initDamage(){
  const crewTotal=COMPS.reduce((a,c)=>a+COMP_DEF[c].crewCount,0);
  // Build crew manifest before damage object so med team can reference it
  const _crew = buildCrewManifest();
  // Find medical crew from built manifest
  const _medCrew = COMPS.flatMap(c => (_crew[c]||[]).filter(cr => cr.dept==='medical'));
  const _medTeam = {};
  for(const cr of _medCrew){
    _medTeam[cr.id] = { id:cr.id, label:cr.role, state:'standby', location:COMPS[0], destination:null, transitEta:0, treating:null, treatT:0, _deployed:false };
  }
  if(Object.keys(_medTeam).length === 0){
    _medTeam._none = { id:'_none', label:'MED', state:'lost', location:COMPS[0], destination:null, transitEta:0, treating:null, treatT:0, _deployed:false };
  }
  player.damage={
    strikes:  Object.fromEntries(COMPS.map(c=>[c,0])),
    flooded:  Object.fromEntries(COMPS.map(c=>[c,false])),
    systems:Object.fromEntries(ALL_SYS.map(s=>[s,'nominal'])),
    // Progressive flooding: rate (units/s) and current level (0-1)
    floodRate:Object.fromEntries(COMPS.map(c=>[c,0])),
    flooding: Object.fromEntries(COMPS.map(c=>[c,0])),
    towers:{fwd:'nominal',aft:'nominal'},
    crew:_crew,
    crewTotal,
    alerts:[],
    sinking:false,
    // HPA banks — operational[0..3] + reserve
    hpa:{ pressure:207, reserve:207, recharging:false },
    // Main ballast tanks — real fill state (0=air/empty, 1=full of water)
    // neutralFill=0.50 gives neutral buoyancy; e-blow drives toward 0
    mbt:{ tanks:[0.50,0.50,0.50,0.50,0.50], trimF:0.25, trimA:0.25, neutralFill:0.50 },
    sinkT:0,
    escapeState:null,
    escapeType:null,
    escapeSurvivors:0,
    escapePlayerSurvived:false,
    escapeDepthM:0,
    escapeT:0,
    escapeQueue:[],
    _tceProcessed:0,

    // Per-room flooding — level 0-1 per room (mirrors fire system)
    roomFlood:    Object.fromEntries(ROOM_IDS.map(id=>[id,0])),
    roomFloodRate:Object.fromEntries(ROOM_IDS.map(id=>[id,0])),

    // Fire — level 0-1 per room (compartment within section)
    fire:Object.fromEntries(ROOM_IDS.map(id=>[id,0])),
    _fireDetected:{},  // roomId -> true when detected
    _fireDetectT:{},   // roomId -> seconds until detection (unmanned rooms)
    _fireWatch:{},   // comp -> { count, t, lastCasCheck, _outOfControlFired }
    _fireDrench:{},        // comp -> true (one-shot, compartment uninhabitable)
    _fireDrenchPending:{}, // comp -> { t: secondsRemaining } during 20s drench countdown
    _fireCritical:{},      // comp -> true (emergency stations already fired for this fire)
    _fireAlarmFired:{},    // roomId -> true (initial detection alarm already broadcast)
    _floodDeckDmg:{},      // comp -> {0,1,2: true} once deck damage has been applied

    // Compartment-level repair jobs (both teams contribute to one shared job)
    repairJobs:{},  // comp -> {sys, progress, totalTime} or null

    // Medical staff — auto-dispatch to casualties (dynamic per nation)
    medTeam:_medTeam,
    _medNoStaffFired:false,

    // DC teams
    teams:(function(){
      // DC Alpha: first room of first compartment. DC Bravo: first room of last compartment.
      const fwdComp=COMPS[0], aftComp=COMPS[COMPS.length-1];
      const fwdRooms=SECTION_ROOMS[fwdComp]||[]; const aftRooms=SECTION_ROOMS[aftComp]||[];
      const alphaHome=fwdRooms[0]||fwdComp; const bravoHome=aftRooms[0]||aftComp;
      return {
        alpha:{
          id:'alpha', label:'DC ALPHA',
          home:alphaHome,
          state:'ready',
          location:alphaHome,
          destination:null,
          transitEta:0,
          task:null,
          repairTarget:null,
          repairProgress:0,
          statusT:0,
          _autoMode:false, _readyT:0, _locked:false,
        },
        bravo:{
          id:'bravo', label:'DC BRAVO',
          home:bravoHome,
          state:'ready',
          location:bravoHome,
          destination:null,
          transitEta:0,
          task:null,
          repairTarget:null,
          repairProgress:0,
          statusT:0,
          _autoMode:false, _readyT:0, _locked:false,
        },
      };
    })(),
    _emergMusterFired:false,

    // Hydraulic pressure — 1.0 = full, 0.0 = empty
    hydPressure: 1.0,

    // Stuck diving planes — null when inactive
    stuckPlanes: null,  // { set:'fwd'|'aft', direction:'dive'|'rise'|'neutral', recoveryT, recovered }

    // Shaft seal leak — permanent speed-dependent flooding
    shaftSealLeak: false,

    // Snorkel flooding (Type 209 only)
    snorkelFloodActive: false,
    _snorkelFloodSeverity: null,  // 'minor'|'major'|'catastrophic'
    _snorkelValveT: 0,

    // Chlorine gas level (Type 209 only) — 0-1 scale
    cl2Level: 0,

    // Hot run torpedo — countdown timer and affected tube
    hotRunCountdown: null,
    hotRunTube: null,

    // Hydrogen level — 0-1 scale (all vessels)
    h2Level: 0,

    // Permanent damage — systems that cannot be repaired at sea
    permanentDamage: new Set(),


    // Watertight Doors — 5 doors between adjacent sections, all open at start
    wtd: Object.fromEntries(WTD_PAIRS.map(([a,b])=>[a+'|'+b,'open'])),
    _wtdSpreadAlerted:{},  // comp -> true once watchkeepers have reported WTD ingress
  };
  session.dcLog=[];
  session.showDcPanel=false;
}

// ── Next damaged system to repair in a compartment (auto-priority) ────────
function _nextRepairTarget(comp,d){
  const sysList=activeSystems(comp);
  // Priority: worst state first. Skip nominal AND permanently damaged systems.
  const repairable=sysList
    .filter(s=>d.systems[s]!=='nominal' && !d.permanentDamage?.has(s))
    .sort((a,b)=>stateIndex(b)-stateIndex(a));
  return repairable[0]||null;
}

// ── Main hit function ─────────────────────────────────────────────────────
function hit(amount,hitX,hitY,forceComp){
  if(player.invuln>0) return;
  player.invuln=2.0;
  const d=player.damage;
  const severity=clamp(amount/55,0,1);
  const comp=forceComp||(hitX!=null&&hitY!=null?hitCompartment(hitX,hitY):COMPS[Math.floor(rand(0,COMPS.length))]);
  const def=COMP_DEF[comp];
  if(!def) return;
  const prev=d.strikes[comp];
  session.hitFlash=0.8;

  if(prev>=1){
    // ── SECOND HIT → CRITICAL BREACH (fast but not instant) ──────────
    // Section was already damaged — structural failure greatly increases ingress rate.
    // Systems are NOT instantly destroyed; deck-level damage events handle that as
    // water rises. 'destroyed' state only applies when a damaged system takes another hit.
    d.strikes[comp]=2;
    // Per-room: pick a second impact room and set catastrophic breach rate
    const _secRooms2=(SECTION_ROOMS[comp]||[]);
    const _impactRoom2=_secRooms2.length>0?_secRooms2[Math.floor(rand(0,_secRooms2.length))]:null;
    // Second hit — catastrophic but still survivable with DC response
    if(_impactRoom2) d.roomFloodRate[_impactRoom2]=Math.max(d.roomFloodRate[_impactRoom2]||0, 0.06+severity*0.06);
    // Reset deck-damage tracking so rising water applies a fresh damage pass
    if(!d._floodDeckDmg) d._floodDeckDmg={};
    d._floodDeckDmg[comp]={};
    if(def.tower&&d.towers[def.tower]!=='destroyed') d.towers[def.tower]='destroyed';

    // DC teams on scene — evacuation roll; transit teams continue to arrive
    for(const team of Object.values(d.teams)){
      if(team.state==='on_scene'&&roomSection(team.location)===comp){
        if(Math.random()<0.75){
          team.state='ready'; team.task=null;
          _woundDcTeamMember(team, d);
          _COMMS?.dc.teamEvacuated(team.label, SECTION_LABEL[comp]);
        } else {
          team.state='lost';
          _COMMS?.dc.teamLost(team.label, SECTION_LABEL[comp]);
        }
      }
    }

    _alert(`${SECTION_LABEL[comp]} — SECOND BREACH`);
    _COMMS?.flood.secondBreach(SECTION_LABEL[comp], COMP_STATION[comp]||'ENG');
    if((comp==='reactor_comp'||comp==='reactor')&&!player.scram&&typeof triggerScram==='function'){
      triggerScram('damage');
      _COMMS?.reactor.scram('damage');
    }
    _checkSinking();

  } else {
    // ── FIRST HIT → PROGRESSIVE FLOODING ────────────────────────────
    d.strikes[comp]=1;

    // Only damage systems near the breach — localised to the impact room and its neighbours.
    // Pick a random room in the section (weighted toward lower decks — torpedo hits hull bottom),
    // then include systems from that room + adjacent rooms.
    const sectionRoomIds=(SECTION_ROOMS[comp]||[]);
    const maxDeck=severity>0.85?0:severity>0.5?1:2; // 0=all decks, 2=bottom only
    const impactCandidates=sectionRoomIds.filter(rid=>(ROOMS[rid]?.deck??1)>=maxDeck);
    const impactRoom=impactCandidates.length>0?impactCandidates[Math.floor(rand(0,impactCandidates.length))]:sectionRoomIds[0];

    // Set per-room flood rate at the impact room (breach location).
    // Rate is higher than old section-level rate because rooms are smaller.
    // 0.04/s base → room fills in ~25s at surface, then spreads to adjacent rooms.
    // 0.02/s base → room fills in ~50s at surface. DC has time to respond.
    d.roomFloodRate[impactRoom]=Math.max(d.roomFloodRate[impactRoom]||0, severity*0.02);
    // Gather systems from impact room + adjacent rooms (blast radius)
    const blastRooms=new Set([impactRoom,...(ROOM_ADJ[impactRoom]||[])]);
    const allSys=[...blastRooms].flatMap(rid=>(ROOM_SYSTEMS[rid]||[]))
      .filter(s=>!SYS_DEF[s]?.dieselOnly||C.player.isDiesel)
      .filter(s=>!SYS_DEF[s]?.nuclearOnly||!C.player.isDiesel)
      .sort(()=>rand(-1,1));
    const sysList=allSys;
    const numHit=severity>0.7?Math.min(3,sysList.length):1;
    let reactorHit=false;
    for(let i=0;i<Math.min(numHit,sysList.length);i++){
      const steps=severity>0.85?2:1;
      const st=damageSystem(sysList[i],steps);
      _alert(`${SYS_LABEL[sysList[i]]} ${st.toUpperCase()}`);
      _COMMS?.sys.damaged(SYS_LABEL[sysList[i]], st, 1.5+i*0.6);
      if(sysList[i]==='steering' && st!=='nominal') _COMMS?.nav.steeringCasualty(st);
      if(sysList[i]==='reactor') reactorHit=true;
    }
    if(reactorHit&&!player.scram){
      if(typeof triggerScram==='function') triggerScram('damage');
      _COMMS?.reactor.scram('damage');
    }
    const cas=_injureComp(comp,severity);
    if(cas.killed>0||cas.wounded>0){
      _alert(`CASUALTIES — ${cas.killed} KIA${cas.wounded>0?`, ${cas.wounded} WND`:''}`);
      _COMMS?.sys.casualties(cas.killed, cas.wounded, SECTION_LABEL[comp]);
    }
    if(cas.wounded>0) _COMMS?.medical.casualtyCallOut(SECTION_LABEL[comp]);
    if(def.tower&&severity>0.7&&rand(0,1)>0.6&&d.towers[def.tower]==='nominal'){
      d.towers[def.tower]='damaged';
      _alert(`ESCAPE TOWER ${def.tower.toUpperCase()} DAMAGED`);
    }
    // Hot run — combat hit to fore_ends, severity > 0.30, loaded tube
    if((comp==='fore_ends'||comp==='forward') && severity > 0.30 && d.hotRunCountdown==null){
      const hrCfg = C.player.casualties?.hotRun || {};
      const loadedTubes = (player.torpTubes||[]).map((v,i)=>({v,i})).filter(t=>t.v===0);
      if(loadedTubes.length > 0 && Math.random() < (hrCfg.combatChance||0.06)){
        const tube = loadedTubes[Math.floor(Math.random()*loadedTubes.length)].i;
        d.hotRunCountdown = hrCfg.countdown || 12;
        d.hotRunTube = tube;
        player.torpTubes[tube] = -2; // locked — cannot fire
        _COMMS?.hotRun?.detected(tube+1);
      }
    }

    // Snorkel flood — combat hit while snorkelling (diesel only)
    // Sets flag; tickSnorkelFlood in casualty-ticks.js resolves severity on next frame
    if(C.player.isDiesel && player.snorkelling && !d.snorkelFloodActive){
      if(Math.random() < (C.player.casualties?.snorkelFlood?.combatChance || 0.30)){
        d._snorkelFloodPending = true;  // picked up by tickSnorkelFlood
      }
    }

    // Hydrogen combat ignition — hit to engine_room when h2Level >= danger
    if((comp==='engine_room'||comp==='engineering'||comp==='aft') && (d.h2Level||0) >= (C.player.casualties?.hydrogen?.dangerLevel||0.50)){
      if(Math.random() < (C.player.casualties?.hydrogen?.combatHitIgnition||0.40)){
        // Detonation handled by tickHydrogen's _detonateHydrogen — set h2Level to explosive to trigger next tick
        d.h2Level = 1.0;
      }
    }

    // Shaft seal — combat hit to aft_ends when shaft_seals degraded+
    if((comp==='aft_ends'||comp==='engineering') && !d.shaftSealLeak){
      const sealState = STATES.indexOf(d.systems.shaft_seals||'nominal');
      if(sealState >= 1 && Math.random() < (C.player.casualties?.shaftSeal?.combatChance||0.25)){
        d.shaftSealLeak = true;
        _COMMS?.shaftSeal?.activated();
      }
    }

    // Stuck planes — combat damage to planes hydraulics
    if(!d.stuckPlanes){
      const spCfg=C.player.casualties?.stuckPlanes||{};
      for(const planesSys of ['planes_fwd_hyd','planes_aft_hyd']){
        const pState=d.systems[planesSys];
        if((pState==='offline'||pState==='destroyed') && Math.random()<(spCfg.combatChance||0.20)){
          const set=planesSys==='planes_fwd_hyd'?'fwd':'aft';
          const dir=player.vy>0.5?'dive':player.vy<-0.5?'rise':'neutral';
          d.stuckPlanes={set, direction:dir,
            recoveryT:rand(spCfg.recoveryTime?.[0]||25, spCfg.recoveryTime?.[1]||40),
            recovered:false};
          _COMMS?.planes?.stuckPlanes?.(set, dir);
          break;
        }
      }
    }

    // Hydraulic pressure — combat hit to control_room when hyd_main already damaged
    if((comp==='control_room'||comp==='forward'||comp==='midships')){
      const hydIdx=STATES.indexOf(d.systems.hyd_main||'nominal');
      if(hydIdx>=1){
        const hydCfg=C.player.casualties?.hydraulic||{};
        d.hydPressure=Math.max(0, (d.hydPressure??1.0) - (hydCfg.combatPressureLoss||0.20));
      }
    }

    // Fire ignition — higher severity hits have a chance of starting a fire
    if(severity>0.35){
      const fireChance=(severity-0.35)/0.65*0.55;
      if(Math.random()<fireChance) igniteFire(comp, severity*0.12);
    }

    // Estimate time to flood without DC — account for current depth pressure
    const _bDepthM=Math.max(0,(player.depth||0)-(world?.seaLevel||0));
    const _bPMult=1+Math.min(_bDepthM/120,4);
    const _roomRate=d.roomFloodRate[impactRoom]||0;
    const tFlood=_roomRate>0?Math.round(1/(_roomRate*_bPMult)):999;
    const urgency=tFlood<60?'CRITICAL — ':tFlood<120?'URGENT — ':'';
    setCasualtyState('emergency');
    _COMMS?.flood.firstHit(SECTION_LABEL[comp], COMP_STATION[comp]||'ENG', urgency, tFlood);
    _COMMS?.flood.closeWTDs(SECTION_LABEL[comp]);
    _emergencyCloseWTDs(d);
  }

  // ── Propulsion casualties from shock / system damage ────────────────
  const cas=C.player.casualties||{};
  // Turbine trip — shock from any hit can trip the turbines
  if(!player._turbineTrip && !player.scram && !player._steamLeak){
    const tripCfg=cas.turbineTrip||{};
    if(Math.random() < (tripCfg.shockChance||0.15)){
      player._turbineTrip={ timer:rand(tripCfg.recoveryTime?.[0]||20, tripCfg.recoveryTime?.[1]||30) };
      _COMMS?.reactor.turbineTrip();
    }
  }

  // Steam leak — when main_turbines or pressuriser already degraded+ and takes another hit
  if(!player._steamLeak && !player.scram){
    const steamCfg=cas.steamLeak||{};
    const turbState=d.systems.main_turbines||'nominal';
    const pressState=d.systems.pressuriser||'nominal';
    const turbVuln=STATES.indexOf(turbState)>=1; // degraded+
    const pressVuln=STATES.indexOf(pressState)>=1;
    if((turbVuln||pressVuln) && Math.random()<(steamCfg.shockChance||0.12)){
      player._steamLeak={ timer:rand(steamCfg.repairTime?.[0]||30, steamCfg.repairTime?.[1]||60) };
      player._turbineTrip=null; // steam leak supersedes turbine trip
      _COMMS?.reactor.steamLeak();
    }
  }

  // Reactor runaway — severe hit to reactor or primary_coolant
  if(!player.scram && severity>0.6){
    const raCfg=cas.reactorRunaway||{};
    const hitReactor=(comp==='reactor_comp'||comp==='reactor'); // reactor comp hit = reactor systems at risk
    if(hitReactor && Math.random()<(raCfg.hitChance||0.08)){
      // Loud acoustic transient
      if(typeof _broadcastTransient==='function'){
        _broadcastTransient(player.wx, player.wy, raCfg.transientRange||3000, raCfg.transientSus||0.6, null);
      }
      _COMMS?.reactor.reactorRunaway();
      triggerScram('runaway');
      // Clear other propulsion casualties — SCRAM overrides
      player._turbineTrip=null;
      player._steamLeak=null;
      player._coolantLeak=null;
    }
  }

  player.hp=Math.max(1,100-Object.values(d.strikes).reduce((a,b)=>a+b,0)*35);
}

// ── Escape ────────────────────────────────────────────────────────────────
function _depthM(){
  return player.depth||0;  // already in metres
}
function canTCE(){
  const d=player.damage; if(!d) return false;
  if(_depthM()>200) return false;
  return _towerAvail('fwd',d)||_towerAvail('aft',d);
}
// Tower available if structurally intact AND escape trunk not destroyed
function _towerAvail(tower,d){
  if(d.towers[tower]==='destroyed') return false;
  const trunkSys=tower==='fwd'?'fwd_escape':'aft_escape';
  return (d.systems[trunkSys]||'nominal')!=='destroyed';
}
function _survChance(type){
  const depth=_depthM();
  if(type==='tce'){
    if(depth<=80)  return 0.96;
    if(depth<=120) return 0.88;
    if(depth<=160) return 0.65;
    if(depth<=200) return 0.35;
    return 0.05;
  }
  if(depth<=50)  return 0.82;
  if(depth<=80)  return 0.65;
  if(depth<=120) return 0.42;
  if(depth<=180) return 0.20;
  if(depth<=250) return 0.08;
  if(depth<=300) return 0.03;
  return 0.01;
}
function _escapeHalt(){
  const p = player;
  if(p){ p.speedOrderKts=0; p.speedDir=0; p.depthOrder=0; }
  _PANEL?.snapToAllStop();
  // Emergency blow is a commanded action — player retains that decision.

  // CO's final log entry — contextual, factual, one line of humanity at the end
  const d=p?.damage;
  const depth=Math.round(p?.depth??0);
  const floodedComps=d?COMPS.filter(cp=>d.flooded[cp]).map(cp=>COMP_DEF[cp]?.label||cp):[];
  const floodStr=floodedComps.length===0?'structural failure'
    :floodedComps.length===1?`flooding in ${floodedComps[0]}`
    :`flooding in ${floodedComps.slice(0,-1).join(', ')} and ${floodedComps[floodedComps.length-1]}`;
  const fit=totalFit()??'?';
  const total=totalCrew()??'?';
  const spd=Math.round(p?.speed??0);
  const trimNote=spd<=1?'no way on':spd<=5?'slow ahead':'making way';
  const closers=['Good luck to you all.','It has been an honour.','God speed.','That will be all.'];
  const closer=closers[Math.floor((session?.missionT??0)*7+depth)%closers.length];
  addLog('CONN',
    `CO — ${floodStr}, depth ${depth}m, ${trimNote}. ${fit} of ${total} hands fit. All hands, abandon ship. ${closer}`,
    _COMMS?.P.CRIT
  );
}

function initiateEscape(type){
  const d=player.damage; if(!d||d.escapeState) return;
  if(type==='tce'&&!canTCE()){_COMMS?.escape.tceNotViable();return;}
  d.escapeType=type;
  d.escapeDepthM=Math.round(_depthM());
  d.escapeT=0; d.escapeSurvivors=0; d._tceProcessed=0;
  if(type==='tce'){
    d.escapeQueue=[];
    const towers=[];
    if(_towerAvail('fwd',d)) towers.push('fwd');
    if(_towerAvail('aft',d)) towers.push('aft');
    for(const comp of COMPS){
      for(const c of (d.crew[comp]||[])){
        if(c.status==='killed') continue;
        let t=null;
        const pref=[COMP_DEF[comp].tower,...towers].filter(Boolean);
        for(const tw of pref){ if(towers.includes(tw)&&canReachTower(comp,tw,d)){t=tw;break;} }
        if(t) d.escapeQueue.push({crewman:c,tower:t});
        else c.status='killed';
      }
    }
    d.escapeState='tce_running';
    setCasualtyState('escape');
    _escapeHalt();
    _COMMS?.escape.tce();
  } else {
    d.escapeState='rush_running';
    d.escapeT=12;
    setCasualtyState('escape');
    _escapeHalt();
    _COMMS?.escape.rush();
  }
}
function _resolveEscape(){
  const d=player.damage;
  const sc=_survChance(d.escapeType);
  let survivors=0;
  for(const comp of COMPS){
    for(const c of (d.crew[comp]||[])){
      if(c.status==='killed') continue;
      if(Math.random()<sc) survivors++;
      else c.status='killed';
    }
  }
  const co=COMPS.flatMap(comp=>(d.crew[comp]||[])).find(c=>c.rating==='CDR');
  const playerSurvives=co?.status==='killed'?false:Math.random()<Math.min(sc+0.15,0.99);
  d.escapeSurvivors=survivors;
  d.escapePlayerSurvived=playerSurvives;
  d.escapeState='complete';
  session.over=true;
  session.escapeResolved=true;
}

// ── Main tick ─────────────────────────────────────────────────────────────
function tick(dt){
  const d=player.damage; if(!d) return;

  // Depth-pressure multiplier: flood rate scales with ambient pressure.
  // 1× at surface, +1× per 120m — caps at 5× (~480m). DC teams fight
  // the base rate, but water ingress is driven by the effective rate.
  // This means at depth, DC can slow but not stop a serious breach —
  // forcing the emergency blow decision.
  const _depthMVal=Math.max(0,(player.depth||0)-(world?.seaLevel||0));
  const _pressureMult=1+Math.min(_depthMVal/120, 4);

  // Flood spread through open watertight doors
  _wtdFloodSpread(dt, d, _pressureMult);

  // ── Per-room flooding ────────────────────────────────────────────────
  // Mirrors the fire system: each room has its own flood level (0-1) and
  // flood rate. Water spreads to adjacent rooms with very high probability
  // and flows downward automatically (gravity). Section-level flooding is
  // aggregated from room floods for buoyancy, trim, evacuation, and sinking.
  for(const comp of COMPS){
    if(d.flooded[comp]) continue;
    const roomIds = SECTION_ROOMS[comp]||[];
    const _vol = COMP_DEF[comp]?.volume || 8;

    // ── Room-level flood progression ──────────────────────────────────
    // Any room with an active breach fills from the breach.
    const _anyBreach = roomIds.some(rid=>(d.roomFloodRate[rid]||0)>0);
    if(!d._roomFloodAlerted) d._roomFloodAlerted={};
    for(const roomId of roomIds){
      const prevRf = d.roomFlood[roomId]||0;
      const roomRate = d.roomFloodRate[roomId]||0;
      if(roomRate > 0){
        const roomCols = ROOMS[roomId]?.colSpan || 1;
        const roomVolScale = 1 / roomCols;
        d.roomFlood[roomId] = Math.min(1, prevRf + roomRate * _pressureMult * roomVolScale * dt);
      }
      // Flood detection comms — fire once per room when flooding first detected.
      // Flooding is always immediately detectable (bilge alarms), unlike fire.
      const rf = d.roomFlood[roomId]||0;
      if(rf >= 0.03 && !d._roomFloodAlerted[roomId]){
        d._roomFloodAlerted[roomId] = true;
        const roomLabel = ROOMS[roomId]?.label || roomId;
        const station = COMP_STATION[comp] || 'ENG';
        // First room in this section to flood triggers full emergency comms
        const sectionFirstFlood = !roomIds.some(rid => rid !== roomId && d._roomFloodAlerted[rid]);
        if(sectionFirstFlood){
          setCasualtyState('emergency');
          _COMMS?.flood.firstHit(SECTION_LABEL[comp], station, '', 999);
          _COMMS?.flood.closeWTDs(SECTION_LABEL[comp]);
          _emergencyCloseWTDs(d);
        }
      }
    }

    // ── Room-level flood spread (gravity + differential transfer) ─────
    // Water TRANSFERS between rooms — leaves the source, enters the target.
    // Gravity dominates: water drains to the lowest point first.
    // Upper rooms only stay flooded once rooms below are full and water backs up.
    for(const roomId of roomIds){
      const rf = d.roomFlood[roomId]||0;
      if(rf < 0.02) continue;
      for(const adjId of (ROOM_ADJ[roomId]||[])){
        const af = d.roomFlood[adjId]||0;
        if(af >= 1.0) continue; // target full, can't accept more
        const adjRoom = ROOMS[adjId];
        const srcRoom = ROOMS[roomId];
        if(!adjRoom || !srcRoom) continue;
        const isBelow = adjRoom.deck > srcRoom.deck;
        const isAbove = adjRoom.deck < srcRoom.deck;

        // Manned room resistance: crew slow ingress with shoring/portable pumps.
        const roomCrewCount = adjRoom.crew || 0;
        const crewResist = Math.min(0.90, roomCrewCount * 0.15);

        let transferAmt = 0;
        if(isBelow){
          // Gravity drain — water always prefers the lowest point.
          // Fast transfer: source drains, target fills. No differential threshold.
          // Rate scales with how much water is in the source room.
          const gravityRate = rf * 0.12 * _pressureMult * (1 - crewResist * 0.5);
          // Only transfer down to equalize — don't overshoot
          const maxTransfer = Math.max(0, rf - af) * 0.5; // move toward equalization
          transferAmt = Math.min(gravityRate * dt, maxTransfer, 1 - af);
        } else if(isAbove){
          // Upward — only when source room is nearly full (water backs up)
          if(rf >= 0.85 && rf > af + 0.05){
            const upRate = (rf - 0.85) * 0.06 * _pressureMult * (1 - crewResist);
            transferAmt = Math.min(upRate * dt, rf - af, 1 - af);
          }
        } else {
          // Horizontal equalization — water finds its level
          const diff = rf - af;
          if(diff > 0.02){
            const horizRate = diff * 0.06 * _pressureMult * (1 - crewResist);
            transferAmt = Math.min(horizRate * dt, diff * 0.5, 1 - af);
          }
        }
        if(transferAmt > 0.0001){
          d.roomFlood[adjId] = Math.min(1, af + transferAmt);
          // Source room loses the water it transferred (conservation of mass)
          d.roomFlood[roomId] = Math.max(0, d.roomFlood[roomId] - transferAmt);
        }
      }
    }

    // Bilge pumps — slow drain in rooms without active breach.
    // Manned rooms drain faster (crew operating portable pumps).
    for(const roomId of roomIds){
      const rf = d.roomFlood[roomId]||0;
      if(rf <= 0 || rf >= 1.0) continue;
      if((d.roomFloodRate[roomId]||0) > 0) continue; // breach active — can't drain
      const roomCrew = ROOMS[roomId]?.crew || 0;
      const drainRate = 0.004 + roomCrew * 0.002; // base + crew boost
      d.roomFlood[roomId] = Math.max(0, rf - drainRate * dt);
    }

    // ── Per-room system damage ────────────────────────────────────────
    // Systems in a flooded room take damage when the room reaches 80%
    for(const roomId of roomIds){
      const rf = d.roomFlood[roomId]||0;
      if(rf < 0.80) continue;
      if(!d._roomFloodDmg) d._roomFloodDmg = {};
      if(d._roomFloodDmg[roomId]) continue; // already applied
      d._roomFloodDmg[roomId] = true;
      const roomSys = (ROOM_SYSTEMS[roomId]||[]);
      for(const sys of roomSys){
        if(d.systems[sys] === 'destroyed') continue;
        const st = damageSystem(sys);
        _COMMS?.sys.damaged(SYS_LABEL[sys], st, 0.5);
      }
    }

    // ── Aggregate section flooding from rooms ─────────────────────────
    // Section flood level = weighted average of room floods (by colSpan).
    // This drives section-level thresholds: evacuation, sinking, buoyancy.
    let totalWeight = 0, weightedFlood = 0;
    for(const roomId of roomIds){
      const w = ROOMS[roomId]?.colSpan || 1;
      totalWeight += w;
      weightedFlood += (d.roomFlood[roomId]||0) * w;
    }
    const oldFl = d.flooding[comp]||0;
    d.flooding[comp] = totalWeight > 0 ? weightedFlood / totalWeight : 0;

    // Derive section floodRate from room rates for backward compat consumers
    const maxRoomRate = Math.max(0, ...roomIds.map(rid => d.roomFloodRate[rid]||0));
    d.floodRate[comp] = maxRoomRate > 0 ? maxRoomRate : 0;
    if(d.floodRate[comp] <= 0 && d.flooding[comp] <= 0.01){
    }

    // Threshold checks — apply regardless of flood source (breach or WTD spread)
    const fl=d.flooding[comp]||0;
    const isSeep=(d._seepComp||{})[comp];

    // Per-room system damage replaces old deck-level damage (see per-room
    // flood progression above — systems damaged when room reaches 80%).

    // 65% — crew evacuation
    if(!isSeep && fl>=0.65 && !(d._evacuated||{})[comp]){
      if(!d._evacuated) d._evacuated={};
      d._evacuated[comp]=true;
      const neighbors=EVAC_TO[comp]||[];
      const compCrew=(d.crew[comp]||[]).filter(cr=>cr.status==='fit'||cr.status==='wounded');
      let evacuated=0,trapped=0;
      for(const cr of compCrew){
        // 80% chance per crew to make it out if a neighbour isn't also flooded
        const openNeighbour=neighbors.find(n=>!d.flooded[n]&&!_sectionNoEvac(n)&&(d.crew[n]||[]).length<SECTION_CAP);
        if(openNeighbour&&Math.random()<0.80){
          cr.displaced=true;
          cr.stationComp=cr.stationComp||comp; // remember home for return
          d.crew[comp]=d.crew[comp].filter(c=>c!==cr);
          if(!d.crew[openNeighbour]) d.crew[openNeighbour]=[];
          cr.comp=openNeighbour;
          d.crew[openNeighbour].push(cr);
          evacuated++;
        } else {
          cr.status='killed';
          trapped++;
        }
      }
      if(evacuated>0||trapped>0){
        _alert('CREW EVACUATING '+SECTION_LABEL[comp].toUpperCase());
        _COMMS?.flood.evacuating(SECTION_LABEL[comp], COMP_STATION[comp]||'ENG', evacuated, trapped);
      }
    }

    // 100% — compartment fully flooded
    if(fl>=1.0&&!d.flooded[comp]){
      d.flooded[comp]=true;
      d.floodRate[comp]=0;
      // Set all rooms in this section to fully flooded and clear breach rates
      for(const rid of roomIds){
        d.roomFlood[rid]=1.0;
        d.roomFloodRate[rid]=0;
      }
      // Final damage step for all systems not already destroyed
      for(const sys of activeSystems(comp)){
        if(d.systems[sys]!=='destroyed') damageSystem(sys);
      }
      const lost=_floodComp(comp);
      if(!d._evacuated) d._evacuated={};
      d._evacuated[comp]=true;
      for(const cr of (d.crew[comp]||[])){
        if(cr.status!=='killed') cr.displaced=true;
      }
      for(const team of Object.values(d.teams)){
        if(team.state==='on_scene'&&roomSection(team.location)===comp){
          if(Math.random()<0.75){
            team.state='ready'; team.task=null;
            _woundDcTeamMember(team, d);
            dcLog(`${team.label} — EVACUATED ${SECTION_LABEL[comp]||comp}. Casualties taken`);
          } else {
            team.state='lost';
            _COMMS?.dc.teamLost(team.label, SECTION_LABEL[comp]||comp);
          }
        }
      }
      _alert(`${SECTION_LABEL[comp]} FLOODED`);
      _COMMS?.flood.uncontrolled(SECTION_LABEL[comp], COMP_STATION[comp]||'ENG', lost);
      if((comp==='reactor_comp'||comp==='reactor')&&!player.scram&&typeof triggerScram==='function'){
        triggerScram('damage');
        _COMMS?.flood.reactorFlooded();
      }
      d.strikes[comp]=2;
      _checkSinking();
    }
  }

  // DC teams then fire (teams set task='fire' on arrival, fire tick reads it)
  _tickWTDAutoClose(dt,d);
  _tickWTDAutoOpen(dt,d);
  _tickTeams(dt,d);
  _tickFire(dt,d);
  _tickDrench(dt,d);
  _tickMedical(dt,d);

  // Alert tick
  for(let i=d.alerts.length-1;i>=0;i--){
    d.alerts[i].t-=dt;
    if(d.alerts[i].t<=0) d.alerts.splice(i,1);
  }

  // Sinking countdown — reserved for future buoyancy system

  // TCE cycling
  if(d.escapeState==='tce_running'){
    d.escapeT+=dt;
    const CYCLE=5.0;
    const towers=[d.towers.fwd!=='destroyed'?'fwd':null,d.towers.aft!=='destroyed'?'aft':null].filter(Boolean);
    const cyclesDone=Math.floor(d.escapeT/CYCLE);
    if(cyclesDone>d._tceProcessed){
      const newCycles=cyclesDone-d._tceProcessed;
      d._tceProcessed=cyclesDone;
      const sc=_survChance('tce');
      for(let p=0;p<newCycles*towers.length*2;p++){
        const entry=d.escapeQueue.shift();
        if(!entry) break;
        if(Math.random()<sc) d.escapeSurvivors++;
        else entry.crewman.status='killed';
      }
      // Progress entry after each cycle
      const remaining=d.escapeQueue.length;
      if(remaining>0){
        addLog('CONN',
          `Escape — ${d.escapeSurvivors} away. ${remaining} remaining at towers.`,
          _COMMS?.P.MED
        );
      }
      if(remaining===0) _resolveEscape();
    }
  }
  if(d.escapeState==='rush_running'){
    d.escapeT-=dt;
    // Single midpoint progress call
    if(!d._rushMidLogged && d.escapeT<=6){
      d._rushMidLogged=true;
      const total=COMPS.reduce((a,cp)=>{
        return a+(d.crew[cp]||[]).filter(x=>x.status!=='killed').length;
      },0);
      addLog('CONN',
        `Escape — hands in the water. ${total} attempting escape.`,
        _COMMS?.P.MED
      );
    }
    if(d.escapeT<=0) _resolveEscape();
  }
}

export const DMG = {
  initDamage,hit,tick,applyHullStress,applyDepthCascade,resetDepthCascade,_escapeHalt,
  sealFlooding,igniteFire,getEffects,maxDCTeams,crewEfficiency,
  totalFit,totalWounded,totalKilled,totalCrew,
  assignTeam,recallTeam,teamAtComp,
  manualDrench,ventN2,
  initiateEscape,canTCE,
  getTrimState,drawHPA,
  toggleWTD,
  relocateCrewForWatch:(watch)=>relocateCrewForWatch(player.damage,watch),
  // Vessel-specific data: use getters so they always return the current layout
  get COMP_DEF(){ return COMP_DEF; },
  get COMPS(){ return COMPS; },
  get COMPARTMENTS(){ return COMPS; },
  get SYS_DEF(){ return SYS_DEF; },
  get SYS_LABEL(){ return SYS_LABEL; },
  get ROOMS(){ return ROOMS; },
  get ROOM_IDS(){ return ROOM_IDS; },
  get SECTION_ROOMS(){ return SECTION_ROOMS; },
  get ROOM_ADJ(){ return ROOM_ADJ; },
  get SECTION_SYSTEMS(){ return SECTION_SYSTEMS; },
  get DIESEL_SECTION_SYSTEMS(){ return DIESEL_SECTION_SYSTEMS; },
  get ROOM_SYSTEMS(){ return ROOM_SYSTEMS; },
  get WTD_PAIRS(){ return WTD_PAIRS; },
  get WTD_RC_KEYS(){ return WTD_RC_KEYS; },
  get SECTION_LABEL(){ return SECTION_LABEL; },
  get SECTION_SHORT(){ return SECTION_SHORT; },
  get COMP_FRACS(){ return COMP_FRACS; },
  get COMP_LABELS(){ return COMP_LABELS; },
  // Non-vessel-specific: static values
  STATES,
  activeSystems,roomSection,effectiveState,
  CREW_MANIFEST,
};
