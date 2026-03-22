'use strict';

import { CONFIG } from '../config/constants.js';
import { rand, clamp, now } from '../utils/math.js';
import { world, player } from '../state/sim-state.js';
import { session } from '../state/session-state.js';
import { env, propagationPath, transmissionLoss } from '../systems/ocean-environment.js';
import { seabedDepthAt } from '../systems/ocean.js';

const C = CONFIG;
const WU_PER_NM = 185.2;

// Layer boundary is now driven by the ocean environment model's mixed layer depth.
// "Above the layer" = depth < mixed layer depth. "Below the layer" = depth > mixed layer depth.
// The thermocline transition zone is modelled as ±20m around the mixed layer depth.
export function inLayer(d){
  const layerDepth = env.propagation.layerDepth || env.svp.mixedLayerDepth || world.layerY1 || 180;
  return d <= layerDepth + 20; // in or above the mixed layer (with 20m transition)
}
// Crossing the layer attenuates signal. Magnitude depends on layer strength
// (combines gradient steepness, depth margin, and sea state).
// Strong layer (summer, calm) → heavy penalty (~0.35). Weak layer (winter, rough) → mild (~0.85).
export function layerPenalty(d1,d2){
  const layerDepth = env.propagation.layerDepth || env.svp.mixedLayerDepth || world.layerY1 || 180;
  const above1 = d1 <= layerDepth + 20;
  const above2 = d2 <= layerDepth + 20;
  if(above1 === above2) return 1.0;
  // Penalty scales with layer strength (0=isothermal→0.95, 1=strong thermocline→0.35)
  const strength = env.propagation.layerStrength ?? 0.5;
  return clamp(1.0 - strength * 0.65, 0.35, 0.95);
}
export function wrapDx(x1,x2){return x2-x1;}
export function wrapDy(y1,y2){return y2-y1;}

// ── Enemy TMA solver — mirrors the player's solveTMA ────────────────────────
// Gives enemies the same bearing-line least-squares solver.
// Result stored on e.tma{X,Y,Quality,Baseline}
export function solveEnemyTMA(e){
  const obs=e.playerBearings;
  if(!obs||obs.length<2){ e.tmaQuality=0; e.tmaX=null; e.tmaY=null; return; }

  let M11=0,M12=0,M22=0,b1=0,b2=0;
  for(const o of obs){
    const s=Math.sin(o.brg), cs=Math.cos(o.brg);
    M11+=s*s; M12+=-s*cs; M22+=cs*cs;
    const d=-s*o.fromX+cs*o.fromY;
    b1+=d*(-s); b2+=d*cs;
  }
  const det=M11*M22-M12*M12;
  if(Math.abs(det)<1e-8){ e.tmaQuality=0; return; }
  const px=(M22*b1-M12*b2)/det;
  const py=(M11*b2-M12*b1)/det;

  // Reject if solution is behind ANY observation (consistent with player solveTMA)
  for(const o of obs){
    const dot=(px-o.fromX)*Math.cos(o.brg)+(py-o.fromY)*Math.sin(o.brg);
    if(dot<-200){ e.tmaQuality=0; return; }
  }

  let maxBase=0;
  for(let i=0;i<obs.length;i++)
    for(let j=i+1;j<obs.length;j++){
      const bd=Math.hypot(obs[i].fromX-obs[j].fromX, obs[i].fromY-obs[j].fromY);
      if(bd>maxBase) maxBase=bd;
    }
  const MIN_BASE=80, GOOD_BASE=400;
  if(maxBase<MIN_BASE){ e.tmaQuality=0; return; }

  // Bearing spread — same gate as player (≥8° for full credit)
  let maxBrgSpread=0;
  for(let i=0;i<obs.length;i++)
    for(let j=i+1;j<obs.length;j++){
      const d=Math.abs(((obs[i].brg-obs[j].brg+3*Math.PI)%(Math.PI*2))-Math.PI);
      if(d>maxBrgSpread) maxBrgSpread=d;
    }
  const qSpread=clamp(maxBrgSpread/(8*Math.PI/180),0,1);

  const qBase=clamp(maxBase/GOOD_BASE,0,1);
  const qObs=clamp(obs.length/8,0,1);
  e.tmaX=px; e.tmaY=py; e.tmaBaseline=maxBase;
  e.tmaQuality=qBase*qObs*qSpread;
}

// Register a new bearing observation from enemy toward player
export function enemyRegisterBearing(e){
  const dx=wrapDx(e.x,player.wx);
  const dy=player.wy-e.y;
  const trueBrg=Math.atan2(dy,dx);
  const dist=Math.hypot(dx,dy);
  // Bearing noise proportional to dist and own noise
  const u=clamp((80+dist*0.08)*(1+e.noise*0.4)/dist, 0.02, 0.20);
  const noisyBrg=trueBrg+rand(-1,1)*u;

  if(!e.playerBearings) e.playerBearings=[];
  // Cull old bearings (>120s game time)
  const T=session.missionT||0;
  e.playerBearings=e.playerBearings.filter(b=>T-b.t<120);
  if(e.playerBearings.length>=16) e.playerBearings.shift();
  e.playerBearings.push({fromX:e.x, fromY:e.y, brg:noisyBrg, t:T});

  // Solve immediately
  solveEnemyTMA(e);

  // Update contact point — TMA position if quality good, else bearing-range estimate
  const prevContact=e.contact;
  if(e.tmaQuality>=0.20 && e.tmaX!=null){
    e.contact={x:e.tmaX, y:e.tmaY, u:200*(1-e.tmaQuality), t:now(), simT:T, strength:e.tmaQuality};
  } else {
    const estRange=dist+(rand(-1,1)*dist*0.25); // ±25% range noise
    e.contact={
      x:e.x+Math.cos(noisyBrg)*estRange,
      y:e.y+Math.sin(noisyBrg)*estRange,
      u:400, t:now(), simT:T, strength:0.15
    };
  }
}

export function enemyHasFireSolution(e){
  if(!e.contact) return false;
  // Contact state must be IDENTIFIED or TRACKING to fire
  const cs = e.contactState || 'NONE';
  if(cs !== 'IDENTIFIED' && cs !== 'TRACKING') return false;
  // Contact age check (sim time)
  const T = session.missionT || 0;
  const age = T - (e.contact.simT ?? T);
  if(age > C.enemy.fireMaxAge) return false;
  // Require TMA quality
  if((e.tmaQuality||0) < 0.20) return false;
  if((e.playerBearings||[]).length < 3) return false;
  return true;
}

// ── Contact state evaluator ──────────────────────────────────────────────────
// Replaces the suspicion-threshold state machine with contact classification.
// Mirrors real submarine doctrine: detect → classify → identify → prosecute.
// Uses ONLY the enemy's own sensor data.
export function evaluateContactState(e){
  const T = session.missionT || 0;
  const cls = C.enemy.classification;
  const obs = e.playerBearings || [];
  const tmaQ = e.tmaQuality || 0;
  const recentObs = obs.filter(b => T - b.t < 120);
  const numObs = recentObs.length;
  const lastObsT = recentObs.length ? recentObs[recentObs.length - 1].t : 0;
  const staleSecs = numObs > 0 ? T - lastObsT : 9999;
  const timeSinceFirst = e.firstDetectionT > 0 ? T - e.firstDetectionT : 0;
  const prev = e.contactState || 'NONE';

  // Role-based tracking threshold — aggressive roles track with less TMA quality
  const roleTrackQ = e.role === 'zeta' ? cls.trackingTmaQ * 0.85
    : e.role === 'ssbn' ? cls.trackingTmaQ * 1.6
    : e.role === 'pinger' ? cls.trackingTmaQ * 1.2
    : cls.trackingTmaQ;

  let next = prev;

  // ── Promotions (upward) ───────────────────────────────────────────────
  if(prev === 'NONE' && numObs >= cls.detectionMinObs){
    next = 'DETECTION';
    if(!e.firstDetectionT) e.firstDetectionT = T;
  }
  if(prev === 'DETECTION'
    && numObs >= cls.classifyMinObs
    && timeSinceFirst >= cls.classifyMinTime
    && tmaQ >= cls.classifyTmaQ){
    next = 'CLASSIFIED';
  }
  if(prev === 'CLASSIFIED'
    && numObs >= cls.identifyMinObs
    && timeSinceFirst >= cls.identifyMinTime
    && tmaQ >= cls.identifyTmaQ){
    // GIUK Cold War: unidentified submerged contact = hostile
    next = 'IDENTIFIED';
  }
  if(prev === 'IDENTIFIED' && tmaQ >= roleTrackQ){
    next = 'TRACKING';
  }

  // ── Degradations (downward from quality loss) ─────────────────────────
  if(prev === 'TRACKING' && tmaQ < cls.trackingDropTmaQ){
    next = 'IDENTIFIED';
  }
  if(prev === 'IDENTIFIED' && tmaQ < cls.identifyDropTmaQ && staleSecs > 30){
    next = 'CLASSIFIED';
  }

  // ── Staleness (downward from no observations) ─────────────────────────
  // TRACKING can degrade to IDENTIFIED (lost solution quality)
  if(prev === 'TRACKING' && staleSecs > cls.staleTrackingAge) next = 'IDENTIFIED';
  // IDENTIFIED can degrade to CLASSIFIED (lost specific ID, still know it's submerged)
  if(next === 'IDENTIFIED' && staleSecs > cls.staleIdentifiedAge) next = 'CLASSIFIED';
  // CLASSIFIED NEVER degrades below CLASSIFIED from staleness alone.
  // Once a crew has confirmed a submerged contact, they keep searching that sector.
  // Only DETECTION (unconfirmed noise) can revert to NONE.
  if(next === 'DETECTION'  && staleSecs > cls.staleDetectionAge){
    next = 'NONE';
    e.firstDetectionT = 0;
  }
  // Full contact loss — only applies to DETECTION (unconfirmed)
  if(numObs === 0 && staleSecs > cls.contactLostAge && next === 'DETECTION'){
    next = 'NONE';
    e.firstDetectionT = 0;
  }

  // Record state change
  if(next !== prev) e.contactStateT = T;
  e.contactState = next;
}

// ── Contact state promotion helper ───────────────────────────────────────────
// Used by external systems (torpedo detection, ping, datum share) to instantly
// promote contact state to at least a given level.
export function promoteContactState(e, minState){
  const RANK = {NONE:0, DETECTION:1, CLASSIFIED:2, IDENTIFIED:3, TRACKING:4};
  const T = session.missionT || 0;
  const currentRank = RANK[e.contactState || 'NONE'] || 0;
  const targetRank = RANK[minState] || 0;
  if(targetRank > currentRank){
    e.contactState = minState;
    e.contactStateT = T;
    if(!e.firstDetectionT) e.firstDetectionT = T;
  }
}

// sensorPos: optional {x,y,depth} — the actual sensor location (buoy, helo dip).
// When omitted, defaults to the enemy ship's own position.
export function enemyUpdateContactFromPing(e,px,py,dist,sensorPos){
  const sx=sensorPos?.x??e.x;
  const sy=sensorPos?.y??e.y;
  const sDepth=sensorPos?.depth??e.vdsDepth??e.depth??400;
  const layer=layerPenalty(py,sDepth);
  const u=(160+dist*0.10)*(layer<1?1.55:1.0);
  e.contact={
    x:px+rand(-u,u),
    y:clamp(py+rand(-u,u),world.seaLevel+80,world.ground-80),
    u, t:now(),
    strength:clamp(0.50+(1-dist/2000)*0.40,0.30,0.92)
  };
  e.suspicion=Math.min(1,e.suspicion+0.45*e.contact.strength);
  promoteContactState(e, 'CLASSIFIED'); // active ping return = confirmed contact
  // Bearing computed from SENSOR position, not ship — correct for buoys/helos
  if(!e.playerBearings) e.playerBearings=[];
  const brg=Math.atan2(py-sy, wrapDx(sx,px));
  const T=session.missionT||0;
  for(let i=0;i<3;i++){
    e.playerBearings.push({fromX:sx+rand(-50,50), fromY:sy+rand(-50,50), brg:brg+rand(-1,1)*0.06, t:T-i*8});
  }
  if(e.playerBearings.length>16) e.playerBearings.splice(0, e.playerBearings.length-16);
  // Rough position hint — lower quality ceiling from ping alone
  e.tmaX=px+rand(-1,1)*150; e.tmaY=py+rand(-1,1)*150;
  e.tmaQuality=Math.min((e.tmaQuality||0) + 0.22, 0.38); // ping gives a start, not a solution
}

// Enemy speed deafness — Soviet hulls noisier, go deaf at lower speeds than NATO
// Uses C.enemy.deafStartKts/deafFullKts/deafnessCeil (Soviet) vs C.player.speedDeafness (NATO)
export function enemySpeedDeafness(e){
  const startKts = C.enemy.deafStartKts ?? 3;
  const fullKts  = C.enemy.deafFullKts  ?? 8;
  const ceil     = C.enemy.deafnessCeil ?? 0.92;
  const kts=Math.hypot(e.vx||0,e.vy||0);
  return 1.0-clamp((kts-startKts)/(fullKts-startKts),0,ceil);
}

export function enemyMaybeHearPlayer(e,dt){
  // Tick interval scales with enemy speed — fast sprinting = deaf
  e._hearTick=(e._hearTick||0)-dt;
  const deafness=enemySpeedDeafness(e);
  const tickBase=rand(0.7,1.3)/Math.max(0.15,deafness);
  if(e._hearTick>0) return;
  e._hearTick=tickBase;

  const dx=wrapDx(e.x,player.wx);
  const dy=player.wy-e.y;
  const d=Math.hypot(dx,dy);
  const rangeNm = d / WU_PER_NM;

  // Max enemy hearing range — same propagation model as player
  const p_env = env.propagation;
  const maxHearNm = Math.max(
    p_env.surfaceDuctRange,
    p_env.directPathRange,
    p_env.bottomBounceRange,
    ...(p_env.czRanges.map(r => r + p_env.czWidth)),
  ) + 5;
  if(rangeNm > maxHearNm) return;

  // Propagation path from player to enemy
  const sonarDepth=e.vdsDepth||e.depth||400;
  const waterDepth = seabedDepthAt((e.x+player.wx)/2, (e.y+player.wy)/2);
  const path = propagationPath(player.depth, sonarDepth, rangeNm, waterDepth);
  if(path === 'shadow' && rangeNm > p_env.directPathRange) return;

  // Source level: player noise (same scale as sensor model)
  const sourceLevel = 120 + player.noise * 30;

  // Transmission loss
  const TL = transmissionLoss(path, rangeNm, 'lf');
  const ambientDB = 55 + env.ambient.total * 25;
  // Enemy self-noise: machinery floor dominates below ~8kt, flow noise above
  // Soviet boats: noisier machinery floor (~58dB) but same flow noise physics
  const enemySpdKts = Math.hypot(e.vx||0,e.vy||0) / (185.2/3600);
  const machineryFloor = e.type === 'boat' ? 55 : 58; // surface ships quieter (no reactor)
  const flowNoise = enemySpdKts > 6 ? (enemySpdKts - 6) * 3.5 : 0; // flow only above 6kt
  const ownShipNoise = machineryFloor + flowNoise;
  const noiseLevel = 10 * Math.log10(Math.pow(10, ownShipNoise/10) + Math.pow(10, ambientDB/10));

  // Enemy array gain: Soviet hull arrays ~20dB, surface ship hull ~18dB
  const enemyArrayGain = e.type === 'boat' ? 18 : 20;
  const snr = sourceLevel - TL - noiseLevel + enemyArrayGain;
  if(snr < -16) return; // well below any threshold

  // Normalise to 0-1 signal for probability calc
  let signal = clamp((snr + 6) / 25, 0, 1);

  if(e.type==='boat' && (player.periscopeT||0)>0) signal*=(C.player.periscope?.detectBoost||1.55);
  if(signal<C.enemy.hearSignalMin) return;

  // ── Enemy deaf arc — player can hide in enemy baffles ─────────────────────
  const sg=C.player.sonar||{};
  const eBaffleBase =(sg.enemyBaffleBase??20)*Math.PI/180;
  const eBaffleMax  =(sg.enemyBaffleMax ??55)*Math.PI/180;
  const eBaffleHalf =clamp(eBaffleBase+(e.speed||0)*(sg.enemyBafflePerKt??2.0)*Math.PI/180, eBaffleBase, eBaffleMax);
  const eRolloff    =(sg.baffleRolloffDeg??20)*Math.PI/180;
  const eBrg        =Math.atan2(dy,dx);
  const eRelAngle   =Math.abs(((eBrg-(e.heading||0)+3*Math.PI)%(Math.PI*2))-Math.PI);
  const eDeadStart  =Math.PI-eBaffleHalf;
  const eFullLimit  =eDeadStart-eRolloff;
  const eGeoMult    =eRelAngle<=eFullLimit?1.0:eRelAngle>=eDeadStart?0.0:1.0-(eRelAngle-eFullLimit)/eRolloff;
  signal*=eGeoMult;
  if(signal<C.enemy.hearSignalMin) return;

  // Detection prob — deafness reduces it when enemy is sprinting; sensitivity scales hearing
  const sensorMult=e._dmgSensorMult??1.0;
  const p=clamp((signal-C.enemy.hearPBase)*C.enemy.hearPScale*deafness*(e.sensitivity||1.0)*sensorMult, 0, 0.85);
  if(Math.random()<p){
    // Suspicion gain scales with signal strength — loud contacts build faster
    const susGain=clamp(0.08+signal*0.35, 0.08, 0.30);
    e.suspicion=Math.min(1, e.suspicion+susGain);
    enemyRegisterBearing(e);
  }
}

export function enemyDecay(e,dt){
  const quiet=(player.noise<C.enemy.quietNoiseThreshold);
  // Decay TMA quality when not actively observing
  const T=session.missionT||0;
  const lastObs=e.playerBearings?.length ? e.playerBearings[e.playerBearings.length-1].t : 0;
  const staleSecs=T-lastObs;
  if(staleSecs>15 && (e.tmaQuality||0)>0){
    e.tmaQuality=Math.max(0,(e.tmaQuality||0)-0.003*dt);
    if(e.tmaQuality<=0){ e.tmaX=null; e.tmaY=null; }
  }

  e.suspicion=Math.max(0,e.suspicion-(C.enemy.susDecayBase+(quiet?C.enemy.susDecayQuietExtra:0))*dt);
  if(e.contact){
    // Stamp sim time on first check if missing
    if(e.contact.simT==null) e.contact.simT=T;
    const age=T-e.contact.simT;
    if(age>C.enemy.contactMaxAge||(quiet&&age>C.enemy.contactMaxAgeQuiet)) e.contact=null;
  }
}

// ── Enemy acoustic noise model ────────────────────────────────────────────────
// Dynamic noise updated each tick — mirrors player signature.js model.
// Soviet-era boats: noisier per knot, cavitate ~25% earlier than NATO boats.
export function updateEnemyNoise(e){
  const spd=Math.hypot(e.vx||0, e.vy||0);
  const floor=e._noiseFloor??0.28;
  // Flow noise: Soviet boats ~30% noisier per knot (worse vibration isolation)
  const flow=(spd/C.player.flowNoiseDiv)*1.3;
  let n=clamp(floor+flow, 0, 1);
  // Cavitation: Soviet props cavitate ~25% earlier than NATO equivalents
  const depth=e.depth??300;
  const d=clamp((depth-world.seaLevel)/C.player.cavitationDepthRef, 0, 2.0);
  const cavThresh=(C.player.cavitationKtsRef+d*(C.player.cavitationDepthRef*C.player.cavitationSlope))*0.75;
  if(spd>cavThresh) n=clamp(n+C.player.cavitationSpike*0.8, 0, 1);
  // Golf-class snorkel: diesel SSBN must surface-snorkel periodically — very loud
  // _snorkeling flag set/cleared by sim.js tick; this is the noise injection point
  if(e._snorkeling) n=clamp(n+0.52, 0, 1);
  // Damage noise penalty: machinery casualties raise noise floor (set by casualty roll in sim.js)
  if(e._dmgNoisePenalty) n=Math.min(1, n+e._dmgNoisePenalty);
  e.noise=n;
}
