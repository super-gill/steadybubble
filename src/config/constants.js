'use strict';

import { VESSELS } from './vessels.js';

export const CONFIG = {
  world: {
    w:12000, h:12000,
    seaLevel:0,
    ground:1900,
    layerY1:180,
    layerY2:280,
    safeDivingDepth:300,
    divingLimit:400,
    designDepth:480,
    maxDepth:500,
    crushDepth:540,
  },
  camera: {
    zoom:0.12,
    followLead:60,
  },
  player: {
    r:28, hpMax:100,
    speedMaxKts:20,
    flankKts:28,
    speedIncrementKts:1,
    speedTau:45,
    turnRateDeg:2.2,
    turnRateMinDeg:0.5,
    periscopeDepth:18,
    depthStep:60, depthHoldRepeat:0.10,
    depthTau:8.0, depthRateMax:1.8,
    buoyancyScale:3.6,
    fillRate:0.022,
    kFill:0.0016,
    depthBrakeZone:15,
    depthMaxFillOffset:0.08,
    ballast:0.0, ballastRate:0.85, buoyAccel:210, buoyDamp:0.85, vyMax:190,
    flankNoiseBoost:0.42, flankTransient:0.28,
    silentRunning:  { speedCap:8, noiseMult:0.55 },
    emergencyTurn:  { dur:2.2, cd:8.0, rudderDeg:35, noiseSpike:0.28 },
    crashDive:      { dur:3.5, cd:12.0, noiseSpike:0.35, tauOverride:0.4, rateMult:3.5 },
    noiseFloor:0.04, flowNoiseDiv:32, turnNoise:0.07,
    trimLevers:     { fore_ends:-2.0, control_room:-0.8, aux_section:-0.2, reactor_comp:0.0, engine_room:0.8, aft_ends:2.0 },
    trimFullAuthority:2.0,
    planeMinSpeed:10.0,
    floodFillEquiv:0.28,
    hpa: {
      maxPressure:207, reservePressure:207, ambientPerMetre:0.1,
      controlMinRatio:1.2, ascentCostPerMetre:0.04, torpedoCost:2,
      blowFlowRate:0.5, blowReferenceBar:50, blowFlowToVy:0.4, blowFlowToFillRate:0.025,
      lpRechargeRate:0.4, hpRechargeRate:2.5, rechargeNoiseAdd:0.55,
    },
    cavitationDepthRef:380, cavitationKtsRef:18, cavitationSlope:0.018, cavitationSpike:0.22,
    torpCd:0.45, cmCd:4.5, cmStock:12, pingCd:9.0, pingPulse:1.25,
    pingDazzle:     { duration:1.5, range:370 },   // ~2nm dazzle range
    torpTubes:4, torpStock:32, torpReloadTime:28, fireDelay:4.5,
    torpArcDeg:55, torpEnableDist:16,       // ~160m enable distance
    torpWireMaxRange:2780, torpWireBreakTurnDeg:90,  // ~15nm wire range
    wireMaxLaunchKts:10, wireSafeKts:10, wireStressKts:15,
    wireStressBreakTime:15, wireInstantBreakKts:15,
    periscope:      { cd:10.0, dur:4.5, revealR:3600, detectBoost:1.55, noiseSpike:0.10 },
    speedDeafness:  { startKts:4, fullDeafKts:10 },
    launchTransientRange:2000, launchTransientSus:0.35,
    pingDatumRange:5000, pingDatumSus:0.75,
    hitR:30,
    casualties: {
      coolantLeak:    { stressThreshold:15, riskPerSec:0.008, degradedRiskMult:3.0, countdown:45, fastMult:1.5, slowMult:0.5, fixChanceHigh:0.65, fixChanceLow:0.30 },
      steamLeak:      { shockChance:0.12, repairTime:[30,60], speedCap:7 },
      turbineTrip:    { shockChance:0.15, throttleSnapThreshold:10, throttleSnapChance:0.20, recoveryTime:[20,30], speedCap:12 },
      reactorRunaway: { hitChance:0.08, transientRange:3000, transientSus:0.60 },
      electricalFire: { degradedChancePerSec:0.0008, offlineChancePerSec:0.0025, unmannedDamagedChancePerSec:0.0002, startIntensity:0.05 },
      stuckPlanes: {
        combatChance:0.20, manoeuvreChance:0.08, wearChance:0.0003,
        recoveryTime:[25,40], recoveryBaseChance:0.85,
        jamPitchRate:0.6, jamPitchRateHighSpeed:1.0,
      },
      hotRun: {
        combatChance:0.06, reloadChanceDegraded:0.02, reloadChanceBase:0.0005,
        countdown:12, ejectBaseChance:0.75, sympatheticChance:0.15,
        acousticTransientEject:0.25, acousticTransientDetonate:0.60,
      },
      hydrogen: {
        generationFactor:0.0008,
        cautionLevel:0.25, dangerLevel:0.50, explosiveLevel:0.75,
        naturalDecay:0.001, forceVentRate:0.05,
        elecFaultIgnitionPerSec:0.03, fireIgnitionPerSec:0.08,
        combatHitIgnition:0.40, randomSparkPerSec:0.0005,
        explosionHpDamage:15, explosionTransient:0.35,
        nuclearChargeRate:0.008, dieselSnorkelChargeRate:0.003, dieselSurfaceChargeRate:0.005,
      },
      snorkelFlood: {
        combatChance:0.30, waveOverChancePerSec:0.002, valveFailureChancePerSec:0.0002,
        minorChance:0.50, majorChance:0.35, catastrophicChance:0.15,
        majorFloodRate:0.005, catastrophicFloodRate:0.015, valveCloseTime:15,
      },
      chlorine: {
        floodThreshold:0.33, generationRate:0.015,
        traceLevel:0.15, hazardousLevel:0.35, lethalLevel:0.60, saturatedLevel:0.85,
        surfaceClearRate:0.08, snorkelClearRate:0.03, naturalDecay:0.002,
        wtdSpreadReduction:0.75,
      },
      shaftSeal: {
        combatChance:0.25, flankRiskPerSec:0.0015, flankStressTime:20,
        wearChance:0.0001, baseLeakRate:0.003, destroyedLeakMult:2.0,
      },
      hydraulic: {
        degradedLeakRate:0.005, offlineLeakRate:0.02, destroyedLeakRate:0.05,
        combatPressureLoss:0.20, recoveryRate:0.01,
        sluggishThreshold:0.60, failThreshold:0.30, completeFailThreshold:0.10,
        fireChancePerSec:0.003, fireStartIntensity:0.15,
      },
    },
  },
  // Vessel presets — imported from vessels.js
  playerPresets: VESSELS,
  detection: {
    detectT:7.5, seenT:2.6, proximityR:180, pingDetectR:1800,
    cz:{ min:4800, max:5500, boost:3.2 },
  },
  tma: {
    defaultRange:900, minObs:2, goodObs:6, minBaseline:4, goodBaseline:18,
    maxBearingAge:600, maxBearings:40,
    qualityThresholdBlob:0.15, qualityThresholdLabel:0.35,
    qualityThresholdRange:0.35, qualityThresholdSolid:0.70,
  },
  torpedo: {
    speed:55, approachSpeed:40, life:1800, dmg:55,
    seekRange:550, seekFOV:0.90, passiveFOV:2.4,
    turnRate:1.55, reacquireChance:0.020, arming:12, searchSnake:0.18,
    seduceFOV:2.80, seduceRange:55, seduceTime:9.5, reacquireDelay:5.5,
    depthRate:2, vertWindow:120, vertFuse:60,
    wireRange: 2780,
  },
  decoy: {
    noisemakerLifeMin:14.0, noisemakerLifeMax:20.0, noisemakerR:22, sigPlayer:1.4, sigEnemy:1.0,
    flareLifeMin:1.8, flareLifeMax:2.6, flareR:12,
  },
  enemy: {
    boatShare:0.35,
    hearBoatRange:2000, hearSubRange:2200, // legacy — bypassed by propagation model
    hearSignalMin:0.04, hearPBase:0.025, hearPScale:1.5,
    deafStartKts:3, deafFullKts:8, deafnessCeil:0.92,
    wolfpackDatumRange:3500,              // ~19nm — reasonable for wolfpack comms
    fireTransientRange:3700,              // ~20nm — torpedo launch transient heard at range
    fireTransientSus:0.45,
    susInvestigate:0.22, susEngage:0.78,
    quietNoiseThreshold:0.14,
    susDecayBase:0.002, susDecayQuietExtra:0.004,   // slower decay — contacts persist longer
    contactMaxAge:120.0, contactMaxAgeQuiet:60.0,   // 2 min / 1 min — realistic prosecution time
    fireMinSus:0.65, fireMaxAge:90.0, fireMinStrength:0.35, // longer contact validity for fire
    boatFireEngage:[22,35], boatFireOther:[50,80],
    boatTorpStock:6, boatTorpSpeed:35, boatTorpLife:1200, boatTorpDmg:28, boatTorpSeek:380,
    subFireEngage:[8,15], subFireOther:[20,40],      // slower fire rate — deliberate shots
    subNavT:[180,400], subPingCd:[30,60], subPingRange:2200,
    subNoiseMin:0.15, subNoiseMax:0.45,              // Soviet subs: quieter floor for realism
    subSprintKtsMin:13, subSprintKtsMax:18,
    subTorpReactR:1600, boatTorpReactR:400,
    subTorpArcDeg:55, subTubes:2, subTorpStock:6, subReloadTime:55,  // slower reload
    subTorpSpeed:40, subTorpApproachSpeed:30, subTorpSeekRange:400,
    subTorpReacquire:0.010, subTorpLife:1800,        // 30 min endurance
    counterFire: {
      reactionDelay:[8.0,15.0], staggerDelay:[3.0,8.0],  // slower reaction — realistic
      maxInitial:2, panicBlurMult:2.5, iterCount:4,
    },
    evasion: {
      skipLayerChance:0.25, sprint2ArcMin:60, sprint2ArcMax:180,
      boldManeuverChance:0.15, knuckleDurMin:3, knuckleDurMax:10,
    },
    classification: {
      detectionMinObs:     1,     // bearings needed for DETECTION
      classifyMinObs:      3,     // bearings needed for CLASSIFIED
      classifyMinTime:     15,    // seconds from first detection
      classifyTmaQ:        0.10,  // min TMA quality for CLASSIFIED
      identifyMinObs:      5,     // bearings needed for IDENTIFIED
      identifyMinTime:     45,    // seconds from first detection
      identifyTmaQ:        0.18,  // min TMA quality for IDENTIFIED
      trackingTmaQ:        0.28,  // min TMA quality for TRACKING (role-adjusted)
      trackingDropTmaQ:    0.20,  // below this: TRACKING → IDENTIFIED
      identifyDropTmaQ:    0.08,  // below this: IDENTIFIED → CLASSIFIED
      // Give-up timers — how long a crew listens before deciding it was nothing.
      // These are LONG — a real crew doesn't forget a contact in seconds.
      staleDetectionAge:   600,   // 10 min: one bearing, listened hard, nothing else → biologics
      staleClassifiedAge:  900,   // 15 min: had multiple bearings, lost them → search bearing
      staleIdentifiedAge:  1200,  // 20 min: knew it was hostile, lost it → expanded search
      staleTrackingAge:    300,   // 5 min: had a solution, lost quality → revert to prosecution
      contactLostAge:      1200,  // 20 min total silence → give up entirely
    },
    adaptation: {
      blurReductionPerMiss:0.15, blurFloor:0.50,
      resetTimeout:60, resetCourseDeg:30,
    },
    asw: {
      activePingThreshold:0.55, activePingInterval:[60,120], activePingContactInterval:30,
      activePingRange:1600, vdsPingRange:2400,
      huntSuspicionFloor:0.70, huntTimeout:300,
      sectorArcDeg:90, sectorExpandRate:1.5, datumHoldTime:120,
    },
    asroc: {
      minRange:185, maxRange:930, rocketSpeed:80, deployDepth:45,  // ~1-5nm range, realistic ASROC
      fireCd:[25,40], susThresh:0.48, contactMaxAge:30,
    },
    spawnMinR:3700, spawnMaxR:7400,   // 20-40nm in world units
    waveSpawnMinR:5500, waveSpawnMaxR:11000, // 30-60nm
    waveFormationSpread:1800, waveDelay:30.0,
    waveComps:[
      ['hunter','hunter'],
      ['pinger','hunter','hunter'],
      ['pinger','hunter','interceptor','interceptor'],
    ],
    interceptorLeadTime:90, interceptorAmbushSpd:3,
    baffleClear: {
      intervalMin:90, intervalMax:150,
      checkDurMin:20, checkDurMax:30,
      turnDeg:35,
      rolesEnabled:['hunter','interceptor','zeta'],
    },
  },
  weapons: {
    mk48_adcap: {
      kind:'torpedo', label:'MK-48 ADCAP', shortLabel:'ADCAP',
      role:'Heavyweight torpedo', desc:'Wire-guided heavyweight torpedo with active/passive seeker. Primary anti-submarine and anti-surface weapon for US submarines.',
      speed:55, approachSpeed:40, life:1800, dmg:55,   // 50km range, ~30 min endurance
      seekRange:550, seekFOV:0.90, passiveFOV:2.4,     // ~3nm active seeker
      turnRate:1.55, reacquireChance:0.020, arming:12, searchSnake:0.18,  // arms at ~350m
      seduceFOV:2.80, seduceRange:55, seduceTime:9.5, reacquireDelay:5.5, // ADCAP has good ECCM
      depthRate:2, vertWindow:120, vertFuse:60,
      wireRange: 2780,  // ~15nm practical wire guidance range
    },
    spearfish: {
      kind:'torpedo', label:'SPEARFISH', shortLabel:'SPEARFISH',
      role:'Heavyweight torpedo', desc:'Royal Navy wire-guided heavyweight torpedo. Fastest NATO torpedo at 70+ knots with superior ECCM and hard-kill capability.',
      speed:70, approachSpeed:40, life:1800, dmg:60,   // 65km range, ~30 min endurance
      seekRange:650, seekFOV:0.95, passiveFOV:2.5, turnRate:1.65,
      reacquireChance:0.025, arming:10, searchSnake:0.16,
      seduceFOV:2.80, seduceRange:45, seduceTime:8.0, reacquireDelay:4.0, // best ECCM
      depthRate:2, vertWindow:120, vertFuse:60,
      wireRange: 2780,  // ~15nm
    },
    tigerfish: {
      kind:'torpedo', label:'TIGERFISH Mk 24', shortLabel:'TIGERFISH',
      role:'Heavyweight torpedo', desc:'1970s-era Royal Navy wire-guided torpedo. Reliable but slow at 35 knots. Inferior ECCM makes it susceptible to countermeasures.',
      speed:35, approachSpeed:25, life:1800, dmg:45,   // 35km range, ~30 min
      seekRange:370, seekFOV:0.75, passiveFOV:2.1, turnRate:1.25,
      reacquireChance:0.008, arming:15, searchSnake:0.22,
      seduceFOV:2.80, seduceRange:90, seduceTime:14.0, reacquireDelay:8.5, // poor ECCM
      depthRate:2, vertWindow:120, vertFuse:60,
      wireRange: 1850,  // ~10nm — older wire system
    },
    sst4: {
      kind:'torpedo', label:'SST-4 / SUT', shortLabel:'SST-4',
      role:'Heavyweight torpedo', desc:'German wire-guided export torpedo. Moderate speed at 35 knots. Reliable and widely deployed across 14+ navies.',
      speed:35, approachSpeed:25, life:1800, dmg:50,   // 28km range, ~30 min
      seekRange:380, seekFOV:0.82, passiveFOV:2.2, turnRate:1.35,
      reacquireChance:0.010, arming:14, searchSnake:0.20,
      seduceFOV:2.80, seduceRange:80, seduceTime:12.0, reacquireDelay:7.0,
      depthRate:2, vertWindow:120, vertFuse:60,
      wireRange: 1850,  // ~10nm
    },
    harpoon: {
      kind:'missile', label:'UGM-84 HARPOON', shortLabel:'HARPOON',
      role:'Anti-ship missile', desc:'Tube-launched anti-ship cruise missile. Sea-skimming active radar seeker. ~120km range. Launch depth limited to 25m.',
      speed:24, range:12040, seekerFOV:0.698, warheadDmg:85,  // 0.9 Mach ≈ 24 wu/s, 65nm range
      reloadMult:1.5, vls:false, maxLaunchDepth:25,
    },
    sub_harpoon: {
      kind:'missile', label:'UGM-84 SUB-HARPOON', shortLabel:'S-HARPOON',
      role:'Anti-ship missile', desc:'Royal Navy variant of Harpoon. Tube-launched anti-ship cruise missile with active radar seeker.',
      speed:24, range:12040, seekerFOV:0.698, warheadDmg:85,
      reloadMult:1.5, vls:false, maxLaunchDepth:25,
    },
    tasm: {
      kind:'missile', label:'BGM-109B TASM', shortLabel:'TASM',
      role:'Anti-ship cruise missile', desc:'Tomahawk Anti-Ship Missile. Long-range sea-skimming cruise missile with radar seeker. ~460km range. Tube or VLS launch. Retired ~1994.',
      speed:20, range:46300, seekerFOV:0.611, warheadDmg:120,  // 0.72 Mach ≈ 20 wu/s, 250nm range
      reloadMult:1.8, vls:true, tubeLaunch:true, maxLaunchDepth:30,
    },
    tlam: {
      kind:'missile', label:'BGM-109 TLAM', shortLabel:'TLAM',
      role:'Land-attack cruise missile', desc:'Tomahawk Land-Attack Missile. GPS/INS guided. Strategic strike against land targets. No anti-ship capability.',
      speed:400, range:999999, seekerFOV:null, warheadDmg:150,
      reloadMult:1.8, vls:true, tubeLaunch:true, maxLaunchDepth:30,
      placeholder:true,
    },
    subroc: {
      kind:'missile', label:'UUM-44 SUBROC', shortLabel:'SUBROC',
      role:'ASW standoff weapon', desc:'Submarine Rocket. Launches from torpedo tube, flies ballistic trajectory, delivers nuclear depth bomb at standoff range. Retired early 1990s.',
      speed:600, range:55000, seekerFOV:null, warheadDmg:200,
      reloadMult:1.5, vls:false, tubeLaunch:true, maxLaunchDepth:300,
      placeholder:true,
    },
    mk67_slmm: {
      kind:'mine', label:'MK-67 SLMM', shortLabel:'SLMM',
      role:'Mobile mine', desc:'Submarine-Launched Mobile Mine. Propelled mine launched from torpedo tube. Swims to target area and settles on the seabed.',
      reloadMult:1.0, vls:false, tubeLaunch:true, maxLaunchDepth:60,
      placeholder:true,
    },
    mk60_captor: {
      kind:'mine', label:'MK-60 CAPTOR', shortLabel:'CAPTOR',
      role:'Encapsulated torpedo mine', desc:'Encapsulated Torpedo. Bottom mine containing a Mk 46 torpedo. Detects passing submarines and launches the torpedo autonomously.',
      reloadMult:1.0, vls:false, tubeLaunch:true, maxLaunchDepth:300,
      placeholder:true,
    },
    stonefish: {
      kind:'mine', label:'STONEFISH MINE', shortLabel:'STONEFISH',
      role:'Bottom mine', desc:'Royal Navy influence mine. Deployed from torpedo tube. Settles on the seabed and detonates on magnetic/acoustic signature.',
      reloadMult:1.0, vls:false, tubeLaunch:true, maxLaunchDepth:200,
      placeholder:true,
    },
    sm39: {
      kind:'missile', label:'SM39 EXOCET', shortLabel:'EXOCET',
      role:'Anti-ship missile', desc:'Submarine-launched Exocet. Encapsulated missile launched from torpedo tube at up to 55m depth. ~50km range.',
      speed:26, range:5000, seekerFOV:0.524, warheadDmg:65,  // 0.93 Mach ≈ 26 wu/s, 27nm range
      reloadMult:1.5, vls:false, maxLaunchDepth:55,
    },
  },
  ship: {
    tracerLife:[0.06,0.14], tracerSpread:0.06, tracerBursts:[2,4],
  },
  visuals:{ screenBubbles:false },
  layout:{ panelH:220, depthStripW:88, uiScaleDefault:1.0 },
};

// ── Weapon type helper ──────────────────────────────────────────────────
// Returns true if the weapon key represents a torpedo (not a missile/mine).
// Handles: null, undefined, 'torp' (legacy), and actual weapon keys.
export function isTorpLoad(key){
  if(!key || key==='torp') return true;
  return (CONFIG.weapons?.[key]?.kind==='torpedo');
}
