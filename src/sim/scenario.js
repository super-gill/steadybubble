'use strict';

import { CONFIG } from '../config/constants.js';
import { rand } from '../utils/math.js';
import { player, enemies } from '../state/sim-state.js';
import { session, addLog, setTacticalState } from '../state/session-state.js';

const C = CONFIG;

// ── Lazy bindings (set via bindScenario) ────────────────────────────────
let _COMMS = null;
let _AI = null;

export function bindScenario(deps) {
  if (deps.COMMS) _COMMS = deps.COMMS;
  if (deps.AI)    _AI    = deps.AI;
}

// ── Scenario spawning ───────────────────────────────────────────────────

// Give an enemy initial awareness of the player's position (with noise).
// Used by scenarios to simulate intelligence briefings / prior detection.
function giveInitialDatum(e, state, noiseNm){
  const NM = 185.2;
  const T = session.missionT || 0;
  const noise = (noiseNm || 5) * NM;
  e.contactState = state;
  e.contactStateT = T;
  e.firstDetectionT = T - 120; // pretend first detection was 2 min ago
  e.suspicion = state === 'IDENTIFIED' ? 0.8 : state === 'CLASSIFIED' ? 0.5 : 0.3;
  e.contact = {
    x: player.wx + rand(-noise, noise),
    y: player.wy + rand(-noise, noise),
    u: noise, t: performance.now()/1000, simT: T,
    strength: state === 'IDENTIFIED' ? 0.7 : state === 'CLASSIFIED' ? 0.4 : 0.2,
  };

  // Synthetic bearing history — enough observations to sustain the state.
  // evaluateContactState checks observation count + TMA quality + time elapsed.
  if (!e.playerBearings) e.playerBearings = [];
  const trueBrg = Math.atan2(player.wy - e.y, player.wx - e.x);
  const obsCount = state === 'IDENTIFIED' ? 8 : state === 'CLASSIFIED' ? 5 : 2;
  for (let i = 0; i < obsCount; i++) {
    // Spread observations over the past 2 minutes from slightly different positions
    const age = (obsCount - i) * 15; // 15s apart
    const drift = rand(-2, 2); // slight position drift
    e.playerBearings.push({
      fromX: e.x + drift, fromY: e.y + drift,
      brg: trueBrg + rand(-0.05, 0.05),
      t: T - age,
    });
  }

  // Set TMA quality high enough to sustain the state
  e.tmaQuality = state === 'IDENTIFIED' ? 0.30
               : state === 'CLASSIFIED' ? 0.15
               : 0.05;
  // TMA position from contact
  e.tmaX = e.contact.x;
  e.tmaY = e.contact.y;
}

export function spawnScenario(scenario){
  session.scenario=scenario;
  enemies.length=0;

  // Spawn distances in world units (185.2 wu = 1nm)
  const NM = 185.2;

  if(scenario==='duel'){
    // 1v1 — single capable hunter at 20-30nm. Summer, good layer. Pure skill.
    // Neither side has initial awareness — pure detection race.
    const brg=rand(0,Math.PI*2);
    _AI.spawnSub(brg, rand(20,30)*NM, 'hunter', 0);
    _COMMS.tactical.battleStations('single');

  } else if(scenario==='ambush'){
    // Ambush — 4 subs, all with your datum. Winter, no layer.
    // 2 close (10-15nm) already prosecuting, 2 further (15-20nm) closing.
    // Close pair feeds datum to the far pair via wolfpack sharing.
    const baseBrg=rand(0,Math.PI*2);
    // Close pair — hunters, already in detection range
    _AI.spawnSub(baseBrg+rand(-0.3,0.3), rand(10,15)*NM, 'hunter', 0);
    _AI.spawnSub(baseBrg+Math.PI+rand(-0.3,0.3), rand(10,15)*NM, 'hunter', 0);
    // Far pair — interceptors, flanking
    _AI.spawnSub(baseBrg+Math.PI*0.5+rand(-0.3,0.3), rand(15,20)*NM, 'interceptor', 0);
    _AI.spawnSub(baseBrg+Math.PI*1.5+rand(-0.3,0.3), rand(15,20)*NM, 'interceptor', 0);
    // All enemies start IDENTIFIED — MPA datum
    for(const e of enemies) giveInitialDatum(e, 'IDENTIFIED', 6);
    _COMMS.tactical.battleStations('barrier');

  } else if(scenario==='patrol'){
    // Barrier transit — sub line + 2 frigates. Winter, no layer, rough.
    // Enemies know subs are transiting — CLASSIFIED (patrol posture, sector search).
    const barrierBrg=rand(-0.2,0.2);
    const roles=['pinger','hunter','hunter','pinger'];
    const spread=10*NM;
    for(let i=0;i<roles.length;i++){
      _AI.spawnSub(barrierBrg, rand(35,45)*NM, roles[i], (i-1.5)*spread);
    }
    // 2 frigates patrolling the barrier line
    _AI.spawnIota(barrierBrg, rand(30,40)*NM, -8*NM);
    _AI.spawnIota(barrierBrg, rand(30,40)*NM, 8*NM);
    // Barrier subs are on alert — CLASSIFIED (know NATO subs are in the area)
    for(const e of enemies){
      if(e.type==='sub') giveInitialDatum(e, 'CLASSIFIED', 15);
    }
    _COMMS.tactical.battleStations('patrol');

  } else if(scenario==='ssbn_hunt'){
    // SSBN hunt — Typhoon + 2 escort SSNs. Spring, building layer.
    // SSBN is unaware. Escorts are on general patrol (DETECTION — sector brief).
    const ssbnBrg=rand(-0.3,0.3)+Math.PI*0.5;
    const ssbnDist=rand(40,60)*NM;
    _AI.spawnSSBN(ssbnBrg, ssbnDist);
    // Two escort SSNs screening the approach, different angles
    const esc1Brg=ssbnBrg+rand(-0.4,-0.1);
    const esc2Brg=ssbnBrg+rand(0.1,0.4);
    const esc1Dist=ssbnDist-rand(10,18)*NM;
    const esc2Dist=ssbnDist-rand(8,15)*NM;
    _AI.spawnSub(esc1Brg, esc1Dist, 'hunter', rand(-2,2)*NM);
    _AI.spawnSub(esc2Brg, esc2Dist, 'hunter', rand(-2,2)*NM);
    // Escorts have a general sector brief — DETECTION
    for(const e of enemies){
      if(e.role==='hunter') giveInitialDatum(e, 'DETECTION', 20);
    }
    _COMMS.tactical.battleStations('ssbn_hunt');

  } else if(scenario==='boss_fight'){
    // Boss fight — Akula at 25-35nm. Summer, best conditions.
    // Mutual awareness — both sides have intel. DETECTION on both.
    const brg=rand(0,Math.PI*2);
    _AI.spawnZeta(brg, rand(25,35)*NM);
    // Akula has a sector brief — knows a NATO sub is in the area
    for(const e of enemies) giveInitialDatum(e, 'DETECTION', 15);
    _COMMS.tactical.battleStations('boss_fight');

  } else if(scenario==='asw_taskforce'){
    // ASW taskforce — full surface group + 1 sub. Autumn, weak layer.
    // They have your datum from a sonobuoy field. CLASSIFIED.
    const grpBrg=rand(0,Math.PI*2);
    const grpDist=rand(20,30)*NM;
    const flanking=5*NM;
    _AI.spawnKappa(grpBrg, grpDist, 0);
    _AI.spawnIota(grpBrg, grpDist, -flanking);
    _AI.spawnIota(grpBrg, grpDist, flanking);
    _AI.spawnLambda(grpBrg, grpDist+4*NM, rand(-3,3)*NM);
    // Hunter sub trailing behind the surface group
    _AI.spawnSub(grpBrg, grpDist+8*NM, 'hunter', rand(-2,2)*NM);
    // All units have your datum — CLASSIFIED from sonobuoy detection
    for(const e of enemies) giveInitialDatum(e, 'CLASSIFIED', 10);
    _COMMS.tactical.battleStations('asw_taskforce');

  } else if(scenario==='free_run'){
    _COMMS.nav.speedReport(0);
  } else {
    // Default: waves — escalating wolfpack
    // Wave 1 starts with DETECTION (rough intel)
    session.wave=0; session.waveDelay=0;
    spawnWave(1);
    for(const e of enemies) giveInitialDatum(e, 'DETECTION', 20);
  }
}

// ── Wave spawning ───────────────────────────────────────────────────────

export function spawnWave(waveNum){
  session.wave=waveNum;
  if(waveNum > 1 && setTacticalState('action')){
    _COMMS.crewState.actionStations('wave');
  }
  session.groupState='patrol';
  session.prosecutingT=0;

  const comps=C.enemy.waveComps;
  const roles=comps[Math.min(waveNum-1, comps.length-1)];
  const count=roles.length;

  // Random bearing for the group to arrive from
  const groupBrg=rand(0, Math.PI*2);
  const dist=rand(C.enemy.waveSpawnMinR, C.enemy.waveSpawnMaxR);
  const spread=C.enemy.waveFormationSpread;

  // Spread members in line-abreast perpendicular to approach bearing
  // Centred so formation is symmetric
  const offsets=[];
  for(let i=0;i<count;i++) offsets.push((i-(count-1)/2)*spread);

  for(let i=0;i<count;i++){
    _AI.spawnSub(groupBrg, dist, roles[i], offsets[i]);
  }

  const waveLabel=waveNum===1?'Conn, Sonar \u2014 first contacts. Patrol group, classify submerged'
    :waveNum===2?'Conn, Sonar \u2014 new group bearing. Prosecution force, classify submerged'
    :'Conn, Sonar \u2014 new contacts. Full group, classify submerged';
  _COMMS.tactical.waveReport(waveLabel, count, Math.round(((groupBrg*180/Math.PI)+360)%360).toString().padStart(3,'0')+'°');
}

// ── Wave management (group state + wave clear) ──────────────────────────

export function tickWaveManagement(dt){
  // Wave management only applies in wave scenario
  if((session.scenario||'waves')==='waves'){
  // Group state: any enemy crossing susEngage flips to prosecuting
  const wasPatrol = session.groupState==='patrol';
  let anyEngaged = false;
  for(const e of enemies){
    if(!e.dead && (e.contactState==='IDENTIFIED'||e.contactState==='TRACKING')){ anyEngaged=true; break; }
  }
  if(anyEngaged && wasPatrol){
    session.groupState='prosecuting';
    session.prosecutingT=0;
    _COMMS.tactical.prosecuting();
    if(setTacticalState('action')){
      _COMMS.crewState.actionStations('contact');
    }
  }
  if(session.groupState==='prosecuting'){
    session.prosecutingT+=dt;
    // Decay back to patrol if no enemy has suspicion above investigate for 90s
    let stillAware=false;
    for(const e of enemies){
      if(!e.dead && e.contactState!=='NONE'){ stillAware=true; break; }
    }
    if(!stillAware && session.prosecutingT>90){
      session.groupState='patrol';
      session.prosecutingT=0;
      _COMMS.tactical.contactLost();
    }
  }

  // Wave clear -- all combatant enemies dead (civilians don't count)
  const combatantsLeft=enemies.some(e=>!e.civilian&&!e.dead);
  if(!combatantsLeft){
    if(session.waveDelay<=0 && session.wave>0){
      session.waveDelay=C.enemy.waveDelay;
      _COMMS.tactical.areaClear(session.wave);
      if(setTacticalState('cruising')){
        _COMMS.crewState.standDown('action');
      }
    }
    if(session.waveDelay>0){
      session.waveDelay-=dt;
      if(session.waveDelay<=0){
        spawnWave(session.wave+1);
      }
    }
  }
  } // end waves-only
}

// ── Victory detection ───────────────────────────────────────────────────

export function tickVictory(dt){
  const sc=session.scenario;
  if(!session._victory && sc!=='waves' && sc!=='free_run'){

    // SSBN hunt -- victory when the boomer is sunk (escort is optional)
    if(sc==='ssbn_hunt' && !session._ssbnVictory){
      const ssbnAlive=enemies.some(e=>e.role==='ssbn'&&!e.dead);
      if(!ssbnAlive){
        session._ssbnVictory=true;
        session._victory=true;
        session.score+=300;
        addLog('CONN','Conn \u2014 break-up noises confirmed. SSBN is destroyed. Mission complete.');
        addLog('CONN','Conn \u2014 well done. Set course for home.');
      }
    }

    // ASW taskforce -- victory when all warships are sunk
    else if(sc==='asw_taskforce' && !session._aswVictory){
      const shipsAlive=enemies.some(e=>e.type==='boat'&&!e.civilian&&!e.dead);
      if(!shipsAlive){
        session._aswVictory=true;
        session._victory=true;
        session.score+=400;
        addLog('CONN','Conn \u2014 all surface contacts destroyed. ASW taskforce neutralised.');
        addLog('CONN','Conn \u2014 well done. Clear the datum and set course for home.');
      }
    }

    // Boss fight -- victory when the Zeta is destroyed
    else if(sc==='boss_fight' && !session._bossVictory){
      const zetaAlive=enemies.some(e=>e.role==='zeta'&&!e.dead);
      if(!zetaAlive){
        session._bossVictory=true;
        session._victory=true;
        session.score+=500;
        addLog('CONN','Conn \u2014 confirmed, Zeta-class is destroyed. That\'s one for the history books.');
        addLog('CONN','Conn \u2014 secure from battle stations. Set course for home.');
      }
    }

    // Duel / Ambush / Patrol -- victory when all non-civilian enemies are dead
    else if(sc==='duel'||sc==='ambush'||sc==='patrol'){
      const alive=enemies.some(e=>!e.civilian&&!e.dead);
      if(!alive){
        session._victory=true;
        const bonus=sc==='duel'?150:sc==='ambush'?350:250;
        session.score+=bonus;
        if(sc==='duel'){
          addLog('CONN','Conn \u2014 contact destroyed. Well fought. Secure from battle stations.');
        } else if(sc==='ambush'){
          addLog('CONN','Conn \u2014 all contacts destroyed. We made it through the ambush. Secure from battle stations.');
        } else {
          addLog('CONN','Conn \u2014 barrier patrol neutralised. All contacts destroyed. Set course for home.');
        }
      }
    }
  }

  // -- Win delay timer -- let COMMS play before showing win screen -----------
  if(session._victory && !session.won){
    session._wonDelayT=(session._wonDelayT||0)+dt;
    if(session._wonDelayT>=8.0){
      session.won=true;
    }
  }
}
