'use strict';
import { CONFIG } from '../config/constants.js';
import { rand, clamp, now } from '../utils/math.js';
import { world, player, enemies, contacts, sonarContacts } from '../state/sim-state.js';
import { session, addLog } from '../state/session-state.js';
import { env, propagationPath, transmissionLoss, isBelowLayer } from '../systems/ocean-environment.js';
import { seabedDepthAt } from '../systems/ocean.js';
import { promoteContactState } from '../ai/perception.js';

const C = CONFIG;

let _COMMS = null;
let _AI = null;
let _DMG = null;
let _MAPS = null;
export function _bindSensors(deps) { if(deps.COMMS) _COMMS=deps.COMMS; if(deps.AI) _AI=deps.AI; if(deps.DMG) _DMG=deps.DMG; if(deps.MAPS) _MAPS=deps.MAPS; }

  // Throttled sonar raw feed — one entry per contact per ~4s, per array
  const _sonarLogThrottle=new Map(); // key: `${entityId}_${array}` → last log time
  function addSonarLog(e, array, brgDeg, signalTier, czContact){
    const key=`${e.x|0}_${array}`;
    const T=session.missionT||0;
    const last=_sonarLogThrottle.get(key)||0;
    if(T-last < 4.0) return; // throttle — don't spam
    _sonarLogThrottle.set(key,T);
    if(!session.sonarLog) session.sonarLog=[];
    const sc=sonarContacts?.get(e);
    const id=sc?.id||'S?';
    const typeLabel=e.type==='boat'?'SURF':'SUB';
    const tierLabel=signalTier>=2?'STRONG':signalTier>=1?'MOD':'FAINT';
    const brgStr=Math.round(brgDeg).toString().padStart(3,'0');
    session.sonarLog.push({t:T, array, id, typeLabel, brgStr, tierLabel, cz:!!czContact});
    if(session.sonarLog.length>60) session.sonarLog.shift();
  }

  let _nextId=1;
  function assignId(){ return 'S'+(_nextId++); }

  // ── TMA quality solver ──────────────────────────────────────────────────────
  // Computes a quality score from bearing geometry. No position stored.
  // Quality drives TDC tier display and wire behaviour — bearing is the only output.
  function solveTMA(c){
    const TMA=C.tma;
    const T=session.missionT||0;
    const obs=c.bearings;
    if(obs.length < TMA.minObs){ c.tmaQuality=0; return; }

    let maxBase=0;
    for(let i=0;i<obs.length;i++)
      for(let j=i+1;j<obs.length;j++){
        const bd=Math.hypot(obs[i].fromX-obs[j].fromX,obs[i].fromY-obs[j].fromY);
        if(bd>maxBase) maxBase=bd;
      }
    if(maxBase<TMA.minBaseline){ c.tmaQuality=0; return; }

    // Signal quality boost: loud close contacts have tighter bearings (lower u_brg).
    // Scale baseline/obs requirements inversely — strong signals need less geometry.
    const avgU=obs.reduce((s,o)=>s+(o.u_brg||0.10),0)/obs.length;
    const sigBoost=clamp(1.5-avgU*8, 1.0, 2.5); // u_brg 0.02→2.3×, 0.10→0.7× (clamped to 1.0)
    const qBase=clamp(maxBase/(TMA.goodBaseline/sigBoost),0,1);
    const qObs=clamp(obs.length/(TMA.goodObs/sigBoost),0,1);
    let maxCross=0;
    for(let i=0;i<obs.length;i++)
      for(let j=i+1;j<obs.length;j++){
        const d=Math.abs(((obs[i].bearing-obs[j].bearing+3*Math.PI)%(Math.PI*2))-Math.PI);
        const cross=Math.min(d,Math.PI-d);
        if(cross>maxCross) maxCross=cross;
      }
    // Crossing angle: with tight bearings, even small real bearing changes matter.
    // 2° minimum (noise floor), 12° for full credit (a modest course change).
    const qCross=clamp((maxCross-2*Math.PI/180)/((12-2)*Math.PI/180),0,1);

    // Straight-leg floor: patient tracking on a straight course gives some quality
    // from Doppler/level analysis. Enough for DEGRADED but never SOLID.
    const straightFloor=qBase*qObs*0.40;  // max ~0.40 on a pure straight leg
    let q=Math.max(qBase*qObs*qCross, straightFloor);

    // Unresolved towed ambiguity with no recent hull coverage — cap at DEGRADED
    const hullAge=T-(c.lastHullBrgT||0);
    if(c.towedCandA && c.towedResolved===null && hullAge>30) q=Math.min(q,0.45);
    c.tmaQuality=q;

    // Maneuver hint: good baseline + many obs but no crossing angle → stuck below DEGRADED
    const stuck = qBase>0.6 && qObs>0.7 && qCross<0.15 && q<0.30;
    if(stuck && !c._hintedManeuver){
      c._hintedManeuver=true;
      _COMMS?.sensors.tmaDegrading(c.id);
    }
    if(!stuck) c._hintedManeuver=false;

    // ── Bearing-cross triangulation for range ────────────────────────────────
    // When we have good crossing geometry (qCross > 0.3), intersect the two
    // most divergent bearing lines to estimate target position and range.
    // Only updates _estRange if no recent active ping (active range is better).
    const activeAge=T-(c._rangeT||0);
    if(qCross>0.12 && obs.length>=3 && (c._rangeSource!=='active' || activeAge>15)){
      // Find the pair with maximum crossing angle
      let bestI=0, bestJ=1, bestCross=0;
      for(let i=0;i<obs.length;i++)
        for(let j=i+1;j<obs.length;j++){
          const d=Math.abs(((obs[i].bearing-obs[j].bearing+3*Math.PI)%(Math.PI*2))-Math.PI);
          const cr=Math.min(d,Math.PI-d);
          if(cr>bestCross){ bestCross=cr; bestI=i; bestJ=j; }
        }
      const a=obs[bestI], b=obs[bestJ];
      // Require meaningful baseline — triangulation needs real separation.
      // At 5kt, 50wu baseline takes ~3 min to build. At 10nm range, this gives
      // ~1.5° of parallax — minimum for a useful range estimate.
      const obsBaseline=Math.hypot(b.fromX-a.fromX, b.fromY-a.fromY);

      if(obsBaseline >= 50){
      // Intersect two rays: P = a.from + t*dir(a.brg), P = b.from + s*dir(b.brg)
      const ca=Math.cos(a.bearing), sa=Math.sin(a.bearing);
      const cb=Math.cos(b.bearing), sb=Math.sin(b.bearing);
      const det=ca*sb-sa*cb;
      if(Math.abs(det)>0.02){
        const ddx=b.fromX-a.fromX, ddy=b.fromY-a.fromY;
        const t=(ddx*sb-ddy*cb)/det;
        if(t>5){
          const ix=a.fromX+ca*t, iy=a.fromY+sa*t;
          const rng=Math.hypot(_AI.wrapDx(player.wx,ix), iy-player.wy);
          const clamped=clamp(rng, 50, 20000);
          // Simple blend — cross-bearing triangulation is geometrically sound,
          // trust it. Better geometry (higher qCross) = faster blend.
          if(c._estRange!=null){
            const blendRate = clamp(bestCross * 2, 0.05, 0.40); // good crossing = blend faster
            c._estRange = c._estRange * (1 - blendRate) + clamped * blendRate;
          } else {
            c._estRange = clamped;
          }
          c._rangeSource='tma';
          c._rangeT=T;
          // ── Range rate — sampled every ~10s to compute CLSNG/OPNG tag ────────
          const rSampleAge=T-(c._rangeSampleT||0);
          if(rSampleAge>=10){
            if(c._rangeSample!=null) c._rangeRate=(c._estRange-c._rangeSample)/rSampleAge;
            c._rangeSample=c._estRange; c._rangeSampleT=T;
          }
          // ── Contact heading estimation — bearing rate + range rate ──
          // Bearing rate gives perpendicular velocity, range rate gives along-bearing
          // velocity. Together they reconstruct the contact's course vector directly
          // from observable sonar data, avoiding unreliable TMA displacement.
          if(c._brgRate!=null && Math.abs(c._brgRate)>0.0003
             && c.latestBrg!=null && c._estRange!=null && c._estRange>200
             && c._rangeRate!=null){
            const brg=c.latestBrg;
            // Perpendicular velocity: v_perp = brgRate * range
            // Positive brgRate = bearing increasing (CW) = contact moving CW around us
            const vPerp=c._brgRate * c._estRange;
            // Along-bearing velocity: positive = opening (range increasing)
            const vAlong=c._rangeRate;
            // Decompose into world XY (perp direction is bearing + π/2)
            const vx=vAlong*Math.cos(brg) + vPerp*(-Math.sin(brg));
            const vy=vAlong*Math.sin(brg) + vPerp*Math.cos(brg);
            const spd=Math.hypot(vx,vy);
            if(spd>5){ // suppress noise from near-stationary estimates
              const rawHdg=Math.atan2(vy,vx);
              // Angular interpolation via sin/cos blend — avoids wrap discontinuity
              c._estHeading=c._estHeading!=null
                ? Math.atan2(Math.sin(rawHdg)*0.35+Math.sin(c._estHeading)*0.65,
                             Math.cos(rawHdg)*0.35+Math.cos(c._estHeading)*0.65)
                : rawHdg;
              c._estHeadingConf=clamp(qCross*qBase, 0, 1);
              c._estHeadingT=T;
            }
          }
          c._tmaEstX=ix; c._tmaEstY=iy; c._tmaEstT=T;
        }
      }
      } // end obsBaseline >= 3
    }
  }


  // fromPos: optional {x,y} — observation point. Defaults to player position.
  // Wire-relayed torpedo contacts use the torpedo's position for TMA triangulation.
  function registerBearing(e, bearing, u_brg, source='hull', fromPos=null){
    const T=session.missionT||0;
    const TMA=C.tma;
    if(sonarContacts.has(e)){
      const c=sonarContacts.get(e);
      c.bearings=c.bearings.filter(b=>T-b.t<TMA.maxBearingAge);

      // Hull array resolves towed port/starboard ambiguity
      if(source==='hull' && c.towedCandA && c.towedResolved===null){
        const lastA=c.towedCandA[c.towedCandA.length-1];
        const lastB=c.towedCandB?.[c.towedCandB.length-1];
        if(lastA||lastB){
          const angDif=(a,b)=>Math.abs(((a-b+3*Math.PI)%(Math.PI*2))-Math.PI);
          const dA=lastA?angDif(lastA.bearing,bearing):Math.PI;
          const dB=lastB?angDif(lastB.bearing,bearing):Math.PI;
          const aWins=dA<30*Math.PI/180 && dB>50*Math.PI/180;
          const bWins=dB<30*Math.PI/180 && dA>50*Math.PI/180;
          if(aWins||bWins){
            if(!c.towedVotes) c.towedVotes={A:0,B:0};
            if(aWins){ c.towedVotes.A++; c.towedVotes.B=0; }
            else     { c.towedVotes.B++; c.towedVotes.A=0; }
            const hullActive=T-(c.lastHullBrgT||0)<5;
            const need=hullActive?1:3;
            if(c.towedVotes.A>=need || c.towedVotes.B>=need){
              c.towedResolved=c.towedVotes.A>=need?'A':'B';
              if(c.towedResolved==='B'){
                // Were tracking wrong side — flush towed obs, inject correct side
                c.bearings=c.bearings.filter(o=>o.source!=='towed');
                const corrObs=(c.towedCandB||[]).filter(o=>T-o.t<TMA.maxBearingAge);
                for(const o of corrObs) c.bearings.push({...o,source:'towed'});
                if(c.bearings.length>TMA.maxBearings) c.bearings=c.bearings.slice(-TMA.maxBearings);
              }
              const relBrg=((bearing-player.heading+3*Math.PI)%(Math.PI*2))-Math.PI;
              const sideStr=relBrg>=0?'starboard':'port';
              _COMMS?.sensors.ambiguityResolved(c.id, sideStr);
            }
          }
        }
      }

      const obsX=fromPos?.x??player.wx;
      const obsY=fromPos?.y??player.wy;
      if(c.bearings.length>=TMA.maxBearings) c.bearings.shift();
      c.bearings.push({fromX:obsX,fromY:obsY,bearing,u_brg,t:T,source});
      c.lastObsT=T; c.lastT=now(); c.activeT=3.0;
      c.latestBrg=bearing;
      if(source==='hull'){ c.latestHullBrg=bearing; c.lastHullBrgT=T; }
      c.latestFromX=obsX; c.latestFromY=obsY;

      // Bearing rate: smooth derivative from last two hull bearings
      // Used for lead-angle at SOLID tier (only source of target motion estimate)
      if(source==='hull' && c._prevHullBrg!=null && c._prevHullBrgT!=null){
        const dt2=T-c._prevHullBrgT;
        if(dt2>0.5 && dt2<30){
          const dBrg=((bearing-c._prevHullBrg+3*Math.PI)%(Math.PI*2))-Math.PI;
          const rawRate=dBrg/dt2;
          c._brgRate=c._brgRate!=null ? c._brgRate*0.7+rawRate*0.3 : rawRate;
        }
      }
      if(source==='hull'){ c._prevHullBrg=bearing; c._prevHullBrgT=T; }

      // Estimated range from bearing-rate and own-speed.
      // Corrected formula: R = ownSpd * |sin(θ)| / |brgRate|
      // where θ is the angle between own heading and the bearing to target.
      // Pure CBDR (θ=0) gives infinite range — clamped. Cross-track (θ=90°) is most accurate.
      // Bearing-rate range REMOVED — inherently unstable at realistic ranges.
      // Range is now solely from cross-bearing triangulation (requires manoeuvre)
      // and active ping (direct measurement). See the qCross block above.

      const prevQ=c.tmaQuality??0;
      const prevTier=prevQ<0.35?0:prevQ<0.70?1:2;
      solveTMA(c);
      const newTier=c.tmaQuality<0.35?0:c.tmaQuality<0.70?1:2;
      if(newTier>prevTier){
        if(newTier===1){
          _COMMS?.sensors.tmaDegraded(c.id);
        }
        if(newTier===2){
          _COMMS?.sensors.tmaSolid(c.id);
        }
      }
      // Classification — staged buildup simulating sonar operator analysis.
      // Stage 0: nothing — bearing only
      // Stage 1 (TMA>=0.20): broadband hull type — SUBMERGED / SURFACE / MERCHANT
      // Stage 2 (TMA>=0.35 + 15-25s): general type from tonals — SSN, SSK, SSBN, FRIGATE, etc.
      // Stage 3 (TMA>=0.50 + 20-40s): specific class from machinery analysis — SSN BETA, SSK GAMMA, etc.
      if(e && !c._classStage) c._classStage=0;
      if(e && c._classStage<3){
        // Stage 1: broadband hull type
        if(c._classStage===0 && c.tmaQuality>=0.20){
          if(e.civilian){
            c.classification='MERCHANT';
          } else if(e.type==='boat'){
            c.classification='SURFACE';
          } else {
            c.classification='SUBMERGED';
          }
          c._classStage=1;
          c._classAccumT=0;
          _COMMS?.sensors.classified(c.id, c.classification);
        }
        // Stage 2: general type from narrowband tonals — requires time at DEGRADED+
        if(c._classStage===1 && c.tmaQuality>=0.35){
          c._classAccumT=(c._classAccumT||0)+(T-(c._lastClassTickT||T));
          if(!c._classNeeded2) c._classNeeded2=e.civilian?5:e.type==='boat'?10:rand(15,25);
          const needed=c._classNeeded2; // surface ships easier to classify
          if(c._classAccumT>=needed){
            if(e.civilian){
              c.classification=e.civType||'MERCHANT';
            } else if(e.type==='boat'){
              const shipTypes={KRIVAK:'FRIGATE',UDALOY:'DESTROYER',GRISHA:'CORVETTE',SLAVA:'CRUISER'};
              c.classification=shipTypes[e.subClass]||'WARSHIP';
            } else {
              const hullTypes={FOXTROT:'SSK',KILO:'SSK',WHISKEY:'SSK',GOLF:'SSB',TYPHOON:'SSBN',DELTA:'SSBN',YANKEE:'SSBN',OSCAR:'SSGN',PAPA:'SSGN'};
              c.classification=hullTypes[e.subClass]||(e.role==='ssbn'?'SSBN':'SSN');
            }
            c._classStage=2;
            c._classAccumT=0;
            _COMMS?.sensors.classified(c.id, c.classification);
          }
        } else if(c._classStage===1){
          c._classAccumT=0; // reset if quality drops below threshold
        }
        // Stage 3: specific class from machinery signature — requires time at solid-ish quality
        if(c._classStage===2 && c.tmaQuality>=0.50 && e.subClass){
          c._classAccumT=(c._classAccumT||0)+(T-(c._lastClassTickT||T));
          if(!c._classNeeded3) c._classNeeded3=e.civilian?0:rand(20,40);
          const needed=c._classNeeded3;
          if(c._classAccumT>=needed){
            if(!e.civilian && e.type==='boat'){
              const shipTypes={KRIVAK:'FRIGATE',UDALOY:'DESTROYER',GRISHA:'CORVETTE',SLAVA:'CRUISER'};
              c.classification=(shipTypes[e.subClass]||'WARSHIP')+' '+e.subClass;
            } else if(!e.civilian){
              const hullTypes={FOXTROT:'SSK',KILO:'SSK',WHISKEY:'SSK',GOLF:'SSB',TYPHOON:'SSBN',DELTA:'SSBN',YANKEE:'SSBN',OSCAR:'SSGN',PAPA:'SSGN'};
              const baseType=hullTypes[e.subClass]||(e.role==='ssbn'?'SSBN':'SSN');
              c.classification=baseType+' '+e.subClass;
            }
            c._classStage=3;
            _COMMS?.sensors.classified(c.id, c.classification);
          }
        } else if(c._classStage===2 && c.tmaQuality<0.50){
          c._classAccumT=0;
        }
        c._lastClassTickT=T;
      }
    } else {
      const id=assignId();
      const newC={
        id, kind:e.type,
        bearings:[{fromX:player.wx,fromY:player.wy,bearing,u_brg,t:T,source}],
        latestBrg:bearing, latestFromX:player.wx, latestFromY:player.wy,
        tmaQuality:0,
        lastObsT:T, lastT:now(), activeT:3.0,
      };
      if(source==='hull'){ newC.latestHullBrg=bearing; newC.lastHullBrgT=T; }
      newC._ref=e;
      sonarContacts.set(e,newC);
      const typeLabel=e.type==='boat'?'surface contact':'subsurface contact';
      const brgDeg=(((Math.atan2(Math.cos(bearing),-Math.sin(bearing))*180/Math.PI)+360)%360);
      if(source==='hull'){
        _COMMS?.sensors.newContact(id, typeLabel, Math.round(brgDeg).toString().padStart(3,'0')+'°');
      } else {
        _COMMS?.sensors.newContactTowed(id, typeLabel, Math.round(brgDeg).toString().padStart(3,'0')+'°');
      }
    }
  }

  // Active ping or proximity — very tight bearing, boosts quality to SOLID directly.
  // Also provides DIRECT RANGE — the primary payoff for going active.
  function registerFix(e, fx, fy, u, source){
    const brg=Math.atan2(fy-player.wy, _AI.wrapDx(player.wx,fx));
    const dist=Math.hypot(_AI.wrapDx(player.wx,fx), fy-player.wy);
    const u_brg=clamp(u/Math.max(dist,50), 0.01, 0.05);
    registerBearing(e, brg, u_brg, 'hull');
    const c=sonarContacts.get(e);
    if(c){
      c.tmaQuality=Math.max(c.tmaQuality, 0.90);
      c.activeT=source==='active'?5.0:3.0;
      // Direct range from ping return — fast blend, small noise
      const rangeNoise=dist*rand(-0.05,0.05); // ±5% measurement error
      const pingRange=Math.max(100, dist+rangeNoise);
      c._estRange=c._estRange!=null ? c._estRange*0.3+pingRange*0.7 : pingRange;
      c._rangeSource='active';
      c._rangeT=session.missionT||0;
    }
  }


  function clearContact(e){ sonarContacts.delete(e); }

  // Contacts persist for living enemies — never deleted, quality decays when stale
  function tickContacts(dt){
    const T=session.missionT||0;
    const TMA=C.tma;
    const STALE_GRACE=28;    // raised from 12 — 12s was too tight at 7kt tick interval
    const DECAY_RATE=0.012;  // slightly slower decay — SOLID should survive a layer dip
    for(const [e,c] of sonarContacts){
      c.activeT=Math.max(0,(c.activeT||0)-dt);
      if(e.dead) continue;
      const timeSinceObs=T-(c.lastObsT||0);
      if(timeSinceObs>STALE_GRACE && c.tmaQuality>0){
        c.tmaQuality=Math.max(0,c.tmaQuality-DECAY_RATE*dt);
      }
      // Estimated depth — noisy initial estimate, converges over time.
      // Real passive depth estimation: rough at first, stabilises with sustained tracking.
      c._depthTickT=(c._depthTickT||0)-dt;
      if(c._depthTickT<=0){
        c._depthTickT=rand(6.0,10.0);
        const trueDepth=e.depth??200;
        if(c.tmaQuality>=(TMA.qualityThresholdSolid||0.70)){
          // SOLID: small noise, heavy smoothing — estimate stabilises
          const noise=(Math.random()-0.5)*40; // ±20m
          const raw=Math.round((trueDepth+noise)/10)*10; // round to 10m
          c._estDepth=c._estDepth!=null
            ? Math.round(c._estDepth*0.92+raw*0.08) // slow drift, stable readout
            : Math.round((trueDepth+(Math.random()-0.5)*80)/25)*25; // initial: ±40m
        } else if(c.tmaQuality>=(TMA.qualityThresholdRange||0.35)){
          // DEGRADED: rougher, slower convergence
          const noise=(Math.random()-0.5)*120; // ±60m
          const raw=Math.round((trueDepth+noise)/25)*25;
          c._estDepth=c._estDepth!=null
            ? Math.round(c._estDepth*0.90+raw*0.10)
            : Math.round((trueDepth+(Math.random()-0.5)*160)/50)*50; // initial: ±80m
        } else {
          // Below DEGRADED: no depth estimate
          c._estDepth=null;
        }
      }
    }
  }

  function setDetected(e,tDetect,tSeen=0){
    e.detectedT=Math.max(e.detectedT||0,tDetect);
    if(tSeen>0) e.seen=Math.max(e.seen||0,tSeen);
    e.lastX=e.x; e.lastY=e.y; e.lastT=now();
  }

  // ── Towed array helpers ───────────────────────────────────────────────────────
  // Mirror bearing: reflect θ about the sub's heading axis
  function mirrorBearing(brg, heading){
    return (2*heading - brg + 3*Math.PI) % (Math.PI*2) - Math.PI;
  }
  // Is bearing inside the cone of silence? (±28° off stern axis)
  function inDeadCone(brg, heading){
    const stern = heading + Math.PI;
    const diff = Math.abs(((brg - stern + 3*Math.PI) % (Math.PI*2)) - Math.PI);
    return diff < 0.49;
  }
  // solveCandidateTMA removed — ambiguity is ONLY resolved by hull array bearing,
  // never automatically by comparing candidate quality scores.

  // Register a towed array bearing — maintains two candidate sets and auto-resolves
  // Register a towed array bearing.
  // Immediately feeds the active-side bearing into the main TMA stream so geometry
  // accumulates from the first detection — no waiting for hull array resolution.
  // towedCandA/B are maintained for rendering (both dashed lines) only.
  // On resolution to 'B', registerBearing flushes the wrong-side obs automatically.
  function registerTowedBearing(e, candABrg, candBBrg, u_brg){
    const T=session.missionT||0;
    const TMA=C.tma;

    // Determine which side to feed into TMA (resolved 'B' → use candB, else candA)
    const existingC=sonarContacts.get(e);
    const activeBrg=(existingC?.towedResolved==='B') ? candBBrg : candABrg;

    // Push active side into main TMA stream (creates contact if new)
    registerBearing(e, activeBrg, u_brg, 'towed');

    // Update rendering candidate sets
    const c=sonarContacts.get(e);
    if(!c) return;
    if(!c.towedCandA){ c.towedCandA=[]; c.towedCandB=[]; c.towedResolved=null; c.towedVotes={A:0,B:0}; }
    c.towedCandA=c.towedCandA.filter(o=>T-o.t<TMA.maxBearingAge);
    c.towedCandB=c.towedCandB.filter(o=>T-o.t<TMA.maxBearingAge);
    if(c.towedCandA.length>=16) c.towedCandA.shift();
    if(c.towedCandB.length>=16) c.towedCandB.shift();
    c.towedCandA.push({fromX:player.wx,fromY:player.wy,bearing:candABrg,u_brg,t:T});
    c.towedCandB.push({fromX:player.wx,fromY:player.wy,bearing:candBBrg,u_brg,t:T});
    c.latestBrgMirror=candBBrg;
  }

  // ── Towed array passive update ──────────────────────────────────────────────
  function towedArrayUpdate(dt){
    if(C.player.hasTowedArray === false) return;
    const ta = player.towedArray;
    if(!ta) return;

    // Tick deployment
    const DEPLOY_TIME = 30, RETRACT_TIME = 20;
    if(ta.state === 'deploying'){
      ta.progress = clamp(ta.progress + dt/DEPLOY_TIME, 0, 1);
      if(!ta._halfwayLogged && ta.progress>=0.5){
        ta._halfwayLogged=true;
        _COMMS?.sensors.arrayDeployHalfway();
      }
      if(ta.progress >= 1){
        ta.state = 'operational';
        ta.progress = 1;
        ta._halfwayLogged=false;
        _COMMS?.sensors.arrayStreamed();
      }
      return; // don't sense while deploying
    }
    if(ta.state === 'retracting'){
      ta.progress = clamp(ta.progress - dt/RETRACT_TIME, 0, 1);
      if(ta.progress <= 0){
        ta.state = 'stowed';
        ta.progress = 0;
        _COMMS?.sensors.arrayInboard();
      }
      return;
    }
    if(ta.state !== 'operational' && ta.state !== 'damaged') return;

    // Damage check — overspeed
    const MAX_SPD = 18, INSTANT_KILL_SPD = 22;
    if(player.speed >= INSTANT_KILL_SPD){
      const prev = ta.state;
      ta.state = prev==='operational' ? 'damaged' : 'destroyed';
      ta.overspeedT = 0;
      _COMMS?.sensors.arrayDamagedMsg(ta.state==='destroyed'
        ? 'Conn, Eng — array cable has parted at high speed. Array lost'
        : 'Conn, Eng — array overspeed damage. Array degraded');
    } else if(player.speed >= MAX_SPD){
      ta.overspeedT = (ta.overspeedT||0) + dt;
      if(ta.overspeedT > 0.5 && !ta._overspeedWarned){
        ta._overspeedWarned=true;
        _COMMS?.sensors.arrayOverspeed(player.speed);
      }
      if(ta.overspeedT > 5){
        ta.overspeedT = 0;
        const prev = ta.state;
        ta.state = prev==='operational' ? 'damaged' : 'destroyed';
        _COMMS?.sensors.arrayDamagedMsg(ta.state==='destroyed'
          ? 'Conn, Eng — array cable has parted, sustained overspeed. Array lost'
          : 'Conn, Eng — array cable stressed, sustained overspeed. Array degraded');
      }
    } else {
      ta.overspeedT = Math.max(0, (ta.overspeedT||0) - dt);
      if(ta.overspeedT<=0) ta._overspeedWarned=false;
    }
    if(ta.state === 'destroyed') return;

    // Towed array characteristics — longer range, lower self-noise than hull
    const operational = ta.state === 'operational';
    const towedSensBonus = operational ? 6 : 0; // dB advantage over hull array
    const selfMaskMul = operational ? 0.20 : 0.40;
    const noiseUMul   = operational ? 0.7  : 1.4;
    const tickRate    = operational ? [0.8,1.4] : [1.2,2.0];

    player.towedTick = (player.towedTick||0) - dt;
    if(player.towedTick > 0) return;
    player.towedTick = rand(tickRate[0], tickRate[1]);

    const heading = player.heading || 0;
    const p_env = env.propagation;
    const ambientNoise = env.ambient.total;

    // Max towed range — towed arrays hear further than hull (VLF sensitivity)
    const maxTowedNm = Math.max(
      p_env.surfaceDuctRange * 1.3,
      p_env.directPathRange * 1.3,
      p_env.bottomBounceRange,
      ...(p_env.czRanges.map(r => r + p_env.czWidth)),
    ) + 10;
    const maxTowedWU = maxTowedNm * WU_PER_NM;

    for(const e of enemies){
      if(e.dead) continue;
      const dx = _AI.wrapDx(player.wx, e.x);
      const dy = e.y - player.wy;
      const d  = Math.hypot(dx, dy);
      if(d > maxTowedWU) continue;

      const trueBrg = Math.atan2(dy, dx);

      // Cone of silence — no returns within ±28° of stern
      if(inDeadCone(trueBrg, heading)) continue;

      const rangeNm = d / WU_PER_NM;
      const srcDepth = e.depth || 200;
      const rcvDepth = player.depth;
      const midX = (player.wx + e.x) / 2;
      const midY = (player.wy + e.y) / 2;
      const waterDepth = seabedDepthAt(midX, midY);
      const path = propagationPath(srcDepth, rcvDepth, rangeNm, waterDepth);

      if(path === 'shadow' && rangeNm > p_env.directPathRange) continue;

      // Source level — same scale as hull passive
      const sourceLevelBase = e.type === 'boat' ? 155 : 120;
      const sourceLevel = sourceLevelBase + (e.noise || 0.3) * 30;

      // Towed array hears VLF better — use VLF absorption for long range
      const freqBand = rangeNm > 15 ? 'vlf' : 'lf';
      const TL = transmissionLoss(path, rangeNm, freqBand);

      // Towed array self-noise is much lower (towed away from hull)
      const ownShipNoise = 55 + player.noise * 40 * selfMaskMul;
      const ambientDB = 55 + ambientNoise * 25;
      const noiseLevel = 10 * Math.log10(Math.pow(10, ownShipNoise/10) + Math.pow(10, ambientDB/10));

      // Towed array gain: ~30dB (longer aperture than hull array)
      const arrayGain = 30;
      const snr = sourceLevel - TL - noiseLevel + arrayGain + towedSensBonus;
      const detectThreshold = -6;
      if(snr < detectThreshold - 10) continue;

      const signal01 = clamp((snr - detectThreshold) / 20, 0, 1);
      if(signal01 <= 0) continue;

      const fatigueT=session.watchFatigue||0;
      const fatiguePenT=1-fatigueT*0.40;
      const isCZ = path.startsWith('cz');
      const p = clamp((0.06 + signal01*0.60 + (e.type==='boat'?0.12:0.06))*fatiguePenT, 0, 0.80);
      if(Math.random() < p){
        const layer=_AI.layerPenalty(player.depth,srcDepth);
        // Towed array bearing noise — SNR-based, same approach as hull
        // Towed arrays have better bearing accuracy than hull (longer aperture)
        const snrNoiseTow = clamp(1.0 - signal01, 0.1, 1.0);
        const baseNoiseDegTow = 0.5 + snrNoiseTow * 5.0; // 0.5° to 5.5° (tighter than hull)
        const layerMult = (layer<1) ? 1.3 : 1.0;
        const noiseDegTow = baseNoiseDegTow * layerMult * noiseUMul
          * (1 + fatigueT*0.25);
        const u_brg = clamp(noiseDegTow * Math.PI/180, 0.003, 0.10);
        const noisyBrg = trueBrg + rand(-1,1)*u_brg;
        const mirrorBrg = mirrorBearing(noisyBrg, heading);

        const sc=sonarContacts?.get(e);
        const alreadyResolved=sc?.towedResolved!=null;
        contacts.push({fromX:player.wx, fromY:player.wy, bearing:noisyBrg, u_brg, life:2.5, kind:e.type, source:'towed'});
        if(!alreadyResolved){
          contacts.push({fromX:player.wx, fromY:player.wy, bearing:mirrorBrg, u_brg, life:2.5, kind:e.type, source:'towed'});
        }

        registerTowedBearing(e, noisyBrg, mirrorBrg, u_brg);
        setDetected(e, C.detection.detectT, 0);
        const brgDegT=((noisyBrg*180/Math.PI)+360)%360;
        const sigTierT=signal01>0.6?2:signal01>0.25?1:0;
        addSonarLog(e,'TOWED',brgDegT,sigTierT,isCZ);
      }
    }
  }

  // Speed deafness — own flow noise masks passive sonar above ~4kt
  function speedDeafnessFactor(){
    const sd=C.player.speedDeafness||{startKts:4,fullDeafKts:10};
    const kts=player.speed;
    return 1.0 - clamp((kts-sd.startKts)/(sd.fullDeafKts-sd.startKts), 0, 0.90);
  }

  // Broadcast a transient noise event — alerts nearby enemies with bearing + suspicion
  // Called by: active ping, torpedo launch, explosion
  function broadcastTransient(srcX, srcY, range, susGain, label){
    const T=session.missionT||0;
    for(const e of enemies){
      if(e.dead) continue;
      const dx=_AI.wrapDx(e.x,srcX), dy=srcY-e.y;  // FROM enemy TO source (correct direction)
      const d=Math.hypot(dx,dy);
      if(d>range) continue;
      const sig=clamp(1-d/range, 0.15, 1.0);
      e.suspicion=Math.min(1, e.suspicion + susGain*sig);
      promoteContactState(e, 'DETECTION'); // transient heard = at least a detection
      // Give enemy a bearing + rough position toward source
      const brg=Math.atan2(dy,dx)+rand(-1,1)*0.08;
      if(!e.playerBearings) e.playerBearings=[];
      e.playerBearings=e.playerBearings.filter(b=>T-b.t<120);
      if(e.playerBearings.length>=16) e.playerBearings.shift();
      e.playerBearings.push({fromX:e.x,fromY:e.y,brg,t:T});
      // Good fix for active ping — estimated position
      const estDist=d*(0.85+rand(-1,1)*0.20);
      e.contact={
        x:srcX, y:srcY,
        u:clamp(d*0.10+80,60,400), t:performance.now()/1000,
        strength:clamp(sig*0.85,0.3,0.9)
      };
    }
    _COMMS?.sensors.contactLabel(label);
  }

  // Player hears an enemy launch transient
  function playerHearTransient(e, srcX, srcY){
    const dx=_AI.wrapDx(player.wx, srcX), dy=srcY-player.wy;
    const d=Math.hypot(dx,dy);
    // Fire transient range: ~20nm (torpedo launch is loud)
    const range = 20 * WU_PER_NM;
    if(d>range) return;
    const brg=Math.atan2(dy,dx);
    const brgDeg=(((Math.atan2(Math.cos(brg),-Math.sin(brg))*180/Math.PI)+360)%360);
    contacts.push({fromX:player.wx,fromY:player.wy,bearing:brg,u_brg:0.05,life:3.5,kind:'sub'});
    // Register bearing strongly for TMA
    const sc=sonarContacts.get(e);
    if(sc){
      registerBearing(e,brg,0.05);
      sc.activeT=Math.max(sc.activeT||0, 4.0);
      sc.lastObsT=session.missionT||0;
    }
    _COMMS?.sensors.launchTransient(Math.round(brgDeg).toString().padStart(3,'0')+'°');
  }

  // ── World units ↔ nautical miles ───────────────────────────────────────────
  const WU_PER_NM = 185.2;

  function passiveUpdate(dt){
    tickContacts(dt);
    player.passiveTick=(player.passiveTick||0)-dt;
    if(player.passiveTick>0) return;

    // Tick interval increases with speed — harder to listen while moving fast
    const deafness=speedDeafnessFactor();
    const quietBonus=1.4-player.noise*1.0;
    player.passiveTick=rand(0.7,1.3)/(Math.max(0.20,quietBonus)*Math.max(0.15,deafness));

    const p_env = env.propagation;
    const ambientNoise = env.ambient.total;
    // Maximum hull passive range in world units — beyond this, skip early
    const maxPassiveNm = Math.max(
      p_env.surfaceDuctRange,
      p_env.directPathRange,
      p_env.bottomBounceRange,
      ...(p_env.czRanges.map(r => r + p_env.czWidth)),
    ) + 5; // +5nm margin
    const maxPassiveWU = maxPassiveNm * WU_PER_NM;

    for(const e of enemies){
      if(e.dead) continue;
      const dx=_AI.wrapDx(player.wx,e.x);
      const dy=_AI.wrapDy(player.wy,e.y);
      const d=Math.hypot(dx,dy);
      if(d > maxPassiveWU) continue;

      const dmgFx=_DMG?.getEffects()||{};
      const rangeNm = d / WU_PER_NM;

      // Determine propagation path and transmission loss
      const srcDepth = e.depth || 200;
      const rcvDepth = player.depth;
      const midX = (player.wx + e.x) / 2;
      const midY = (player.wy + e.y) / 2;
      const waterDepth = seabedDepthAt(midX, midY);
      const path = propagationPath(srcDepth, rcvDepth, rangeNm, waterDepth);

      // Shadow zone — very low detection probability
      if(path === 'shadow' && rangeNm > p_env.directPathRange) continue;

      // Source level: enemy noise (0-1 scale) → dB re 1μPa
      // Quiet SSN at creep ≈ 120dB, noisy at flank ≈ 150dB
      // Surface ship ≈ 150-170dB
      const sourceLevelBase = e.type === 'boat' ? 155 : 120;
      const sourceLevel = sourceLevelBase + (e.noise || 0.3) * 30;

      // Transmission loss from propagation model
      const TL = transmissionLoss(path, rangeNm, 'lf');

      // Receiver noise: own-ship self-noise + ambient ocean noise
      // Quiet sub at 5kt ≈ 65dB, full speed ≈ 95dB
      const ownShipNoise = 55 + player.noise * 40;
      const ambientDB = 55 + ambientNoise * 25;    // calm ≈ 55dB, SS6 ≈ 70dB
      const noiseLevel = 10 * Math.log10(Math.pow(10, ownShipNoise/10) + Math.pow(10, ambientDB/10));

      // Array gain: hull-mounted spherical array provides ~25dB processing gain
      const arrayGain = 25;

      // Signal-to-noise ratio (sonar equation: SNR = SL - TL - NL + AG)
      const snr = sourceLevel - TL - noiseLevel + arrayGain;

      // Sonar equipment sensitivity
      const sonarDamageMult = dmgFx.sonarRangeMult ?? 1.0;
      const squal = C.player.sonarQuality ?? 0.85;
      const effectiveSNR = snr + 10 * Math.log10(squal * sonarDamageMult);

      // Detection threshold: ~-6dB for initial detection
      const detectThreshold = -6;
      if(effectiveSNR < detectThreshold - 10) continue; // well below threshold, skip

      // ── Bow array deaf arc — hull sonar cannot hear into own stern null ──────
      const trueBearing=Math.atan2(dy,dx);
      const sg=C.player.sonar||{};
      const baffleBase=(sg.baffleHalfAngleDegBase??15)*Math.PI/180;
      const baffleMax =(sg.baffleHalfAngleDegMax ??45)*Math.PI/180;
      const baffleHalf=clamp(baffleBase+(player.speed||0)*(sg.baffleHalfAngleDegPerKt??1.5)*Math.PI/180, baffleBase, baffleMax);
      const rolloff   =(sg.baffleRolloffDeg??20)*Math.PI/180;
      const relAngle  =Math.abs(((trueBearing-(player.heading||0)+3*Math.PI)%(Math.PI*2))-Math.PI);
      const deadStart =Math.PI-baffleHalf;
      const fullLimit =deadStart-rolloff;
      const geoMult   =relAngle<=fullLimit?1.0:relAngle>=deadStart?0.0:1.0-(relAngle-fullLimit)/rolloff;

      // Final detection signal — apply directional and deafness penalties in dB
      const geoDB = geoMult > 0.01 ? 10 * Math.log10(geoMult) : -40; // 0dB at broadside, -40dB in baffles
      const deafDB = deafness > 0.01 ? 10 * Math.log10(deafness) : -20;
      const finalSNR = effectiveSNR + geoDB + deafDB;
      const signal01 = clamp((finalSNR - detectThreshold) / 20, 0, 1);

      if(signal01 <= 0) continue;

      // Watch fatigue — tired operators miss contacts and bearings drift
      const fatigue=session.watchFatigue||0;
      const fatiguePenalty=1-fatigue*0.40;
      const isCZ = path.startsWith('cz');
      const p=clamp((0.05+signal01*0.55+(e.type==='boat'?0.10:0.05))*fatiguePenalty, 0, 0.75);
      if(Math.random()<p){
        const layer=_AI.layerPenalty(player.depth,srcDepth);
        // Bearing noise driven by signal quality (SNR-based)
        // Strong signal → tight bearing (±1°), faint → loose (±8°)
        // Real hull array: ±1-3° at good SNR, ±5-8° at detection threshold
        const snrNoise = clamp(1.0 - signal01, 0.1, 1.0); // 0.1 at perfect, 1.0 at threshold
        const baseNoiseDeg = 1.0 + snrNoise * 7.0; // 1° to 8° based on SNR
        const layerMult=(layer<1)?1.4:1.0; // crossing layer degrades bearing
        const noiseDeg = baseNoiseDeg * layerMult
          * (dmgFx.bearingNoiseMult??1.0)
          * (1 + fatigue*0.3); // fatigue adds up to 30% more noise
        const u_brg=clamp(noiseDeg * Math.PI/180, 0.005, 0.15); // convert to radians, cap at ±8.5°
        const noisyBearing=trueBearing+rand(-1,1)*u_brg;
        contacts.push({fromX:player.wx,fromY:player.wy,bearing:noisyBearing,u_brg,life:2.5,kind:e.type});
        registerBearing(e,noisyBearing,u_brg,'hull');
        setDetected(e,C.detection.detectT,0);
        // Sonar raw feed
        const brgDeg=((noisyBearing*180/Math.PI)+360)%360;
        const sigTier=signal01>0.6?2:signal01>0.25?1:0;
        addSonarLog(e,'HULL',brgDeg,sigTier,isCZ);
      }
    }
  }

  function proximityDetect(){
    for(const e of enemies){
      if(e.dead) continue;
      const dx=_AI.wrapDx(player.wx,e.x);
      const dy=_AI.wrapDy(player.wy,e.y);
      const d=Math.hypot(dx,dy);
      if(d<C.detection.proximityR){
        setDetected(e,C.detection.detectT+1.0,C.detection.seenT);
        registerFix(e,e.x,e.y,30,'proximity');
      }
    }
  }

  function activePing(){
    if(player.pingCd>0) return false;
    player.pingCd=C.player.pingCd;
    player.sonarPulse=C.player.pingPulse;
    // Ping is a loud transient — big noise spike
    player.noiseTransient=Math.min(1,player.noiseTransient+0.65);

    // Active sonar: source level ~220dB, MF band (10-50kHz).
    // Two-way propagation: ping out + echo back = 2× transmission loss.
    // Detection range: typically 10-20nm in good conditions.
    const activeSourceLevel = 220; // dB re 1μPa
    const activeThreshold = 80;    // dB — minimum return echo strength
    const p_env = env.propagation;
    // Active range limited by 2-way TL. Approximate max: ~20nm in good conditions.
    const maxActiveNm = 25;
    const maxActiveWU = maxActiveNm * WU_PER_NM;

    let hits=0;
    for(const e of enemies){
      if(e.dead) continue;
      const dx=_AI.wrapDx(player.wx,e.x);
      const dy=_AI.wrapDy(player.wy,e.y);
      const d=Math.hypot(dx,dy);
      if(d > maxActiveWU) continue;

      const rangeNm = d / WU_PER_NM;
      const srcDepth = player.depth;
      const tgtDepth = e.depth || 200;
      const waterDepth = seabedDepthAt((player.wx+e.x)/2, (player.wy+e.y)/2);
      const path = propagationPath(srcDepth, tgtDepth, rangeNm, waterDepth);

      // Two-way TL: ping goes out and echo comes back (MF band)
      const oneWayTL = transmissionLoss(path, rangeNm, 'mf');
      const twoWayTL = oneWayTL * 2;

      // Target strength: submarines ~15dB, surface ships ~20dB
      const targetStrength = e.type === 'boat' ? 20 : 15;

      const echoLevel = activeSourceLevel - twoWayTL + targetStrength;
      if(echoLevel >= activeThreshold){
        setDetected(e,C.detection.detectT,0);
        registerFix(e,e.x,e.y,20+d*0.04,'active');
        hits++;
      }
    }
    _COMMS?.sensors.activePing(hits);

    // DATUM — ping is heard by ALL enemies in a very wide radius
    // Active ping travels one-way at full source level — heard much further than echo returns
    // Datum range: ~40nm (one-way propagation at 220dB source level)
    const datumRangeNm = 40;
    const datumRangeWU = datumRangeNm * WU_PER_NM;
    const datumSus=C.player.pingDatumSus||0.75;
    broadcastTransient(player.wx, player.wy, datumRangeWU, datumSus, null);
    let alerted=0;
    for(const e of enemies){
      if(!e.dead){
        const dx=_AI.wrapDx(player.wx,e.x), dy=player.wy-e.y;
        if(Math.hypot(dx,dy)<datumRangeWU) alerted++;
      }
    }
    _COMMS?.sensors.pingDatum(alerted);
    return true;
  }

export const SENSE = {setDetected,passiveUpdate,towedArrayUpdate,proximityDetect,activePing,clearContact,tickContacts,registerBearing,registerFix,broadcastTransient,playerHearTransient};
