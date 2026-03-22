'use strict';

// ── Ocean Environment Model ─────────────────────────────────────────────
// Phase 2 of the realism overhaul.
// Computes sound velocity profiles, propagation paths, ambient noise,
// and environmental conditions from location data.
//
// This module is the physics layer. It does NOT handle bathymetry or
// terrain collision — that remains in ocean.js.
//
// Usage:
//   initEnvironment(location, season)  — call on scenario load
//   tickEnvironment(dt)                — call each frame (diurnal changes)
//   env                                — read-only environment state

import { player, world } from '../state/sim-state.js';
import { session } from '../state/session-state.js';
import { clamp } from '../utils/math.js';
import { seabedDepthAt, bottomTypeAt } from './ocean.js';
import { generateThermoclineTiles, thermoclineAt } from './thermocline-tiles.js';

// ═══════════════════════════════════════════════════════════════════════════
// 1. ENVIRONMENT STATE
// ═══════════════════════════════════════════════════════════════════════════

export const env = {
  // ── Location identity ──────────────────────────────────────────────────
  locationKey: null,
  season: 'winter',
  timeOfDay: 'day',         // 'dawn'|'day'|'dusk'|'night'
  missionElapsedHrs: 0,

  // ── SVP parameters (from location data + diurnal adjustment) ──────────
  svp: {
    surfaceTemp: 8.0,
    mixedLayerDepth: 80,
    thermoclineGradient: -0.08,
    thermoclineBottom: 400,
    secondaryThermoclines: [],
    haloclineDepth: 250,
    haloclineStrength: 0.3,
    deepIsothermalTemp: 3.0,
    sofarAxisDepth: 500,
  },

  // ── Weather (fixed per scenario, rolled from location ranges) ─────────
  weather: {
    windSpeed: 15,          // knots
    windDirection: 270,     // degrees true
    seaState: 3,            // Beaufort-derived (0-9)
    precipitation: 'none',  // 'none'|'rain'|'heavy_rain'|'snow'
    cloudCover: 0.6,        // 0-1
    visibility: 8,          // nautical miles
  },

  // ── Ambient noise (0-1 scale, summed into a total) ────────────────────
  ambient: {
    windNoise: 0.15,        // from sea state
    shippingNoise: 0.3,     // from location shipping density
    biologicsNoise: 0.1,    // seasonal marine life
    rainNoise: 0,           // from precipitation
    total: 0.55,            // sum (clamped 0-1)
  },

  // ── Propagation (computed from SVP + water depth at player position) ──
  propagation: {
    directPathRange: 12,      // nm
    surfaceDuctRange: 15,     // nm (if both in mixed layer)
    surfaceDuctDepth: 80,     // metres (= mixed layer depth)
    czRanges: [],             // nm — [30, 60, 90] or empty if too shallow
    czWidth: 3,               // nm — width of each CZ annulus
    shadowZoneStart: 12,      // nm
    shadowZoneEnd: 28,        // nm
    bottomBounceRange: 0,     // nm (depends on bottom type + depth)
    sofarAxisDepth: 500,      // metres
    layerDepth: 80,           // metres — tactical "the layer" depth (clamped to water depth)
    layerStrength: 0.5,       // 0-1 — how protective the layer is (0=negligible, 1=excellent)
    absorptionPerNm: {
      vlf: 0.001,
      lf: 0.01,
      mf: 0.05,
      hf: 0.20,
    },
    vlfPenetrationDepth: 20,  // metres — VLF comms reception limit
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. SOUND VELOCITY COMPUTATION (Mackenzie equation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute sound velocity (m/s) at a given depth using the simplified
 * Mackenzie (1981) equation.
 *
 * @param {number} T — temperature in °C
 * @param {number} S — salinity in ppt (parts per thousand)
 * @param {number} D — depth in metres
 * @returns {number} sound velocity in m/s
 */
export function soundVelocity(T, S, D) {
  return 1448.96
    + 4.591 * T
    - 0.05304 * T * T
    + 0.0002374 * T * T * T
    + 1.340 * (S - 35)
    + 0.01630 * D
    + 1.675e-7 * D * D;
}

/**
 * Get temperature at a given depth from the current SVP profile.
 * Models the full water column: mixed layer → thermocline → deep isothermal.
 *
 * @param {number} depth — metres below surface
 * @returns {number} temperature in °C
 */
export function temperatureAtDepth(depth) {
  const s = env.svp;

  // Above mixed layer — uniform surface temperature
  if (depth <= s.mixedLayerDepth) return s.surfaceTemp;

  // Through main thermocline — linear gradient
  if (depth <= s.thermoclineBottom) {
    const dBelow = depth - s.mixedLayerDepth;
    return s.surfaceTemp + s.thermoclineGradient * dBelow;
  }

  // Below main thermocline — approach deep isothermal asymptotically
  const tempAtThermBottom = s.surfaceTemp
    + s.thermoclineGradient * (s.thermoclineBottom - s.mixedLayerDepth);

  // Check secondary thermoclines
  let temp = tempAtThermBottom;
  for (const st of s.secondaryThermoclines) {
    if (depth >= st.depth && depth <= st.depth + st.thickness) {
      temp += st.gradient * (depth - st.depth);
      return Math.max(temp, s.deepIsothermalTemp);
    }
  }

  // Exponential approach to deep isothermal temperature
  const depthBelowTherm = depth - s.thermoclineBottom;
  const decayRate = 0.003; // controls how fast temp approaches deep value
  const range = tempAtThermBottom - s.deepIsothermalTemp;
  return s.deepIsothermalTemp + range * Math.exp(-decayRate * depthBelowTherm);
}

/**
 * Get salinity at a given depth. Simple model: base 35 ppt with a
 * halocline perturbation.
 *
 * @param {number} depth — metres below surface
 * @returns {number} salinity in ppt
 */
export function salinityAtDepth(depth) {
  const s = env.svp;
  const baseSalinity = 35.0;

  // Halocline — salinity step around haloclineDepth
  if (s.haloclineStrength <= 0) return baseSalinity;

  const halfWidth = 50; // metres — transition width
  const dist = depth - s.haloclineDepth;
  // Smooth step using tanh
  const step = 0.5 * (1 + Math.tanh(dist / halfWidth));
  return baseSalinity + s.haloclineStrength * step;
}

/**
 * Compute sound velocity at a given depth using the current SVP profile.
 *
 * @param {number} depth — metres below surface
 * @returns {number} sound velocity in m/s
 */
export function soundVelocityAtDepth(depth) {
  return soundVelocity(temperatureAtDepth(depth), salinityAtDepth(depth), depth);
}

/**
 * Compute the full SVP curve — sound velocity at regular depth intervals.
 * Used for display and for finding the SOFAR axis.
 *
 * @param {number} maxDepth — maximum depth to compute (metres)
 * @param {number} step — depth interval (metres)
 * @returns {Array<{depth: number, sv: number, temp: number}>}
 */
export function computeSVPCurve(maxDepth = 2000, step = 10) {
  const curve = [];
  for (let d = 0; d <= maxDepth; d += step) {
    curve.push({
      depth: d,
      sv: soundVelocityAtDepth(d),
      temp: temperatureAtDepth(d),
    });
  }
  return curve;
}

/**
 * Find the depth of minimum sound velocity (SOFAR axis) from the SVP curve.
 *
 * @param {number} maxDepth — maximum depth to search
 * @returns {number} depth of SOFAR axis in metres
 */
export function findSOFARAxis(maxDepth = 3000) {
  let minSV = Infinity;
  let minDepth = 0;
  for (let d = 0; d <= maxDepth; d += 5) {
    const sv = soundVelocityAtDepth(d);
    if (sv < minSV) {
      minSV = sv;
      minDepth = d;
    }
  }
  return minDepth;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. PROPAGATION MODEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Recompute all propagation parameters from the current SVP and water depth.
 * Called on init and whenever conditions change (diurnal shift).
 *
 * @param {number} waterDepth — water depth at position of interest (metres)
 */
function computePropagation(waterDepth) {
  const p = env.propagation;
  const s = env.svp;

  // ── Tile-based thermocline ────────────────────────────────────────────
  // Query the thermocline tile system at the player's position.
  // The tile provides topDepth, thickness, tempDrop, screenStrength —
  // all pre-computed with seasonal base, zone modifiers, sea state, seabed
  // clamp, patchiness, and tile interpolation.
  const tile = thermoclineAt(player.wx, player.wy);

  let effectiveLayerDepth;
  const thermoclineExists = tile.present;

  if (!thermoclineExists) {
    effectiveLayerDepth = waterDepth; // no layer — everything is "above layer"
  } else {
    effectiveLayerDepth = tile.topDepth;
  }

  p.layerDepth = Math.round(effectiveLayerDepth);
  p.surfaceDuctDepth = thermoclineExists ? p.layerDepth : Math.round(waterDepth * 0.5);
  p.layerStrength = tile.screenStrength;

  // Store tile data for HUD access
  p._tileThickness = tile.thickness;
  p._tileTempDrop = tile.tempDrop;
  p._tileBottomDepth = tile.bottomDepth;

  // ── Direct path range ────────────────────────────────────────────────
  // In the mixed layer, sound travels in a surface duct. Range depends on
  // layer depth and sea state (rougher seas scatter more, reducing range).
  // Empirical fit: ~1nm per 5m of layer depth, sea state penalty.
  const seaStatePenalty = 1.0 - env.weather.seaState * 0.04; // SS6 → 0.76
  p.directPathRange = clamp(effectiveLayerDepth * 0.2 * seaStatePenalty, 3, 20);

  // ── Surface duct range ───────────────────────────────────────────────
  // Enhanced range within the mixed layer. Deeper layer = longer duct.
  // Only effective when both source and receiver are in the duct.
  p.surfaceDuctRange = clamp(effectiveLayerDepth * 0.25 * seaStatePenalty, 5, 25);

  // ── Convergence zones ────────────────────────────────────────────────
  // CZ requires: deep water (>~2× SOFAR axis depth) and a sound velocity
  // profile that curves sound back to the surface.
  //
  // CZ range ≈ function of SOFAR axis depth and water depth.
  // Atlantic typical: CZ1 ≈ 30nm, CZ2 ≈ 60nm, CZ3 ≈ 90nm.
  // Shallow water or near-surface SOFAR → no CZ.
  const sofarDepth = findSOFARAxis(Math.min(waterDepth, 3000));
  p.sofarAxisDepth = sofarDepth;

  p.czRanges = [];
  p.czWidth = 3; // nm — typical annulus width

  // CZ only forms if water is deep enough and SOFAR axis is well below mixed layer
  if (waterDepth > 1500 && sofarDepth > s.mixedLayerDepth + 100) {
    // CZ range scales with SOFAR depth. Empirical: CZ1 ≈ 25-35nm for
    // SOFAR at 800-1200m. Shallower SOFAR = shorter CZ range.
    const czBase = clamp(sofarDepth * 0.03 + 5, 20, 40);
    const maxCZ = 3; // up to CZ3
    for (let i = 1; i <= maxCZ; i++) {
      const czRange = czBase * i;
      // CZ can't exceed water depth limitation (bottom absorbs)
      if (czRange * 1852 > waterDepth * 4) break; // rough geometric limit
      p.czRanges.push(Math.round(czRange));
    }
  }

  // ── Shadow zone ──────────────────────────────────────────────────────
  // Between end of direct path and start of CZ1. Sound refracts downward
  // through the thermocline and away from the receiver.
  p.shadowZoneStart = p.directPathRange;
  p.shadowZoneEnd = p.czRanges.length > 0 ? p.czRanges[0] - p.czWidth : p.directPathRange + 15;

  // ── Bottom bounce ────────────────────────────────────────────────────
  // Sound bounces off the seabed. Effective range depends on bottom type
  // and water depth. Rock reflects well, mud absorbs.
  const bottomReflectivity = _bottomReflectivity(bottomTypeAt(player.wx, player.wy));
  if (waterDepth < 3000 && bottomReflectivity > 0.2) {
    // Empirical: range ≈ 2× water depth (geometry) × reflectivity
    p.bottomBounceRange = clamp(
      (waterDepth / 1852) * 2 * bottomReflectivity,
      0, 25
    );
  } else {
    p.bottomBounceRange = 0;
  }

  // ── Absorption by frequency band ─────────────────────────────────────
  // Thorp (1967) absorption model, simplified.
  // These are approximate dB/nm at typical frequencies.
  p.absorptionPerNm.vlf = 0.001;  // <1kHz — propagates thousands of nm
  p.absorptionPerNm.lf = 0.01;    // 1-10kHz
  p.absorptionPerNm.mf = 0.05;    // 10-50kHz — active sonar band
  p.absorptionPerNm.hf = 0.20;    // >50kHz — mine hunting, close-range

  // ── VLF comms penetration ────────────────────────────────────────────
  p.vlfPenetrationDepth = 20; // metres — constant
}

/**
 * Get bottom reflectivity coefficient from bottom type.
 */
function _bottomReflectivity(type) {
  switch (type) {
    case 'rock':  return 0.85;
    case 'sand':  return 0.55;
    case 'mixed': return 0.45;
    case 'mud':   return 0.20;
    default:      return 0.35;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. AMBIENT NOISE MODEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute ambient noise levels from weather and location data.
 */
function computeAmbientNoise() {
  const a = env.ambient;
  const w = env.weather;

  // Wind/wave noise — scales with sea state (Wenz curves simplified)
  // SS0 → ~0.02, SS3 → ~0.15, SS6 → ~0.40, SS9 → ~0.80
  a.windNoise = clamp(w.seaState * w.seaState * 0.01 + w.seaState * 0.02, 0, 0.8);

  // Shipping noise — from location data, constant per scenario
  // Already set during init from location.ambient.shippingDensity

  // Rain noise — broadband surface noise
  a.rainNoise = w.precipitation === 'heavy_rain' ? 0.25
    : w.precipitation === 'rain' ? 0.12
    : w.precipitation === 'snow' ? 0.03
    : 0;

  // Total ambient — capped at 1.0
  a.total = clamp(a.windNoise + a.shippingNoise + a.biologicsNoise + a.rainNoise, 0, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. DIURNAL VARIATION
// ═══════════════════════════════════════════════════════════════════════════

// Diurnal cycle: solar heating shallows the mixed layer during the day,
// nocturnal cooling deepens it at night.
// Cycle length: 24 sim-hours. Effect: ±20% of base mixed layer depth.

const DIURNAL_PERIOD_S = 24 * 3600; // 24 hours in seconds

/**
 * Apply diurnal variation to the mixed layer depth.
 * Dawn = base depth, Day = shallowing, Dusk = base, Night = deepening.
 *
 * @param {number} baseDepth — the season's base mixed layer depth (metres)
 * @param {number} simTimeS — mission elapsed time in seconds
 * @param {number} cloudCover — 0-1, reduces solar heating effect
 * @returns {number} adjusted mixed layer depth in metres
 */
function diurnalMixedLayer(baseDepth, simTimeS, cloudCover) {
  // Phase: 0 = dawn, 0.25 = noon, 0.5 = dusk, 0.75 = midnight
  const phase = (simTimeS % DIURNAL_PERIOD_S) / DIURNAL_PERIOD_S;

  // Cosine curve: noon = shallowest (negative amplitude), midnight = deepest
  const amplitude = 0.20 * (1 - cloudCover * 0.6); // clouds reduce effect
  const variation = -Math.cos(phase * 2 * Math.PI) * amplitude;

  return Math.round(baseDepth * (1 + variation));
}

/**
 * Get time-of-day label from mission time.
 */
function timeOfDayFromPhase(simTimeS) {
  const phase = (simTimeS % DIURNAL_PERIOD_S) / DIURNAL_PERIOD_S;
  if (phase < 0.125 || phase >= 0.875) return 'dawn';
  if (phase < 0.375) return 'day';
  if (phase < 0.625) return 'dusk';
  return 'night';
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. INITIALISATION & TICK
// ═══════════════════════════════════════════════════════════════════════════

let _baseSVP = null;     // season's base SVP (before diurnal adjustment)
let _locationData = null; // reference to location module
let _lastWaterDepth = 0; // last water depth used for propagation calc
let _lastPropX = 0;      // last player position for propagation calc
let _lastPropY = 0;

/**
 * Initialise the ocean environment from location data and season.
 * Called once on scenario load (from resetScenario in sim/index.js).
 *
 * @param {object} location — location data module (from locations/index.js)
 * @param {string} season — 'winter'|'spring'|'summer'|'autumn'
 */
export function initEnvironment(location, season = 'winter') {
  _locationData = location;
  env.locationKey = location.key;
  env.season = season;
  env.missionElapsedHrs = 0;

  // ── Load SVP from location ───────────────────────────────────────────
  const svpData = location.svp?.[season] || location.svp?.winter;
  if (svpData) {
    _baseSVP = { ...svpData };
    Object.assign(env.svp, svpData);
  }

  // ── Roll weather from location ranges ─────────────────────────────────
  const wr = location.weather?.[season];
  if (wr) {
    const w = env.weather;
    w.windSpeed = _randRange(wr.windMin, wr.windMax);
    w.windDirection = Math.floor(Math.random() * 360);
    w.seaState = _randRange(wr.ssMin, wr.ssMax);
    w.precipitation = wr.precip || 'none';
    w.cloudCover = _randRange(wr.cloudMin * 100, wr.cloudMax * 100) / 100;
    w.visibility = w.seaState <= 2 ? 12 : w.seaState <= 4 ? 8 : w.seaState <= 6 ? 4 : 2;
  }

  // ── Ambient noise from location ──────────────────────────────────────
  env.ambient.shippingNoise = location.ambient?.shippingDensity ?? 0.3;
  const bioSeason = location.ambient?.biologics;
  env.ambient.biologicsNoise = (typeof bioSeason === 'object')
    ? (bioSeason[season] ?? 0.1) : (bioSeason ?? 0.1);

  // ── Generate thermocline tiles ──────────────────────────────────────
  const worldSize = location.worldSize || 22224;
  generateThermoclineTiles(location, season, env.weather.seaState, worldSize);

  // ── Compute derived values ───────────────────────────────────────────
  _lastWaterDepth = _averageWaterDepth(location);
  computeAmbientNoise();
  computePropagation(_lastWaterDepth);

  env.timeOfDay = 'dawn'; // missions start at dawn
}

/**
 * Tick the ocean environment. Called every frame.
 * Handles diurnal variation of the mixed layer.
 *
 * @param {number} dt — delta time in seconds (after time compression)
 */
export function tickEnvironment(dt) {
  if (!_baseSVP) return;

  // Track elapsed mission time in hours
  env.missionElapsedHrs += dt / 3600;

  // Diurnal mixed layer variation
  const simTimeS = (session.missionT || 0);
  const newMLD = diurnalMixedLayer(
    _baseSVP.mixedLayerDepth,
    simTimeS,
    env.weather.cloudCover
  );

  const oldMLD = env.svp.mixedLayerDepth;
  env.svp.mixedLayerDepth = newMLD;

  // Update time of day label
  env.timeOfDay = timeOfDayFromPhase(simTimeS);

  // Recompute propagation when:
  // 1. Mixed layer depth changes significantly (diurnal), OR
  // 2. Player has moved over significantly different water depth (terrain)
  // This makes the layer position-dependent — over shallow ridges the
  // thermocline weakens or collapses entirely.
  const currentWaterDepth = seabedDepthAt(player.wx, player.wy);
  const mldChanged = Math.abs(newMLD - oldMLD) > 2;
  const depthChanged = Math.abs(currentWaterDepth - _lastWaterDepth) > 30;
  // Recompute when player moves ~2nm (crosses tile boundary region)
  const posChanged = Math.hypot(player.wx - _lastPropX, player.wy - _lastPropY) > 370;

  if (mldChanged || depthChanged || posChanged) {
    _lastWaterDepth = currentWaterDepth;
    _lastPropX = player.wx;
    _lastPropY = player.wy;
    computePropagation(currentWaterDepth);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. QUERY FUNCTIONS (for sensors, AI, UI)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a submarine at the given depth is below the layer.
 * Being below the layer breaks direct-path detection from above.
 *
 * @param {number} depth — metres below surface
 * @returns {boolean}
 */
export function isBelowLayer(depth) {
  return depth > env.propagation.layerDepth;
}

/**
 * Check if a submarine at the given depth can receive VLF comms.
 *
 * @param {number} depth — metres below surface
 * @returns {boolean}
 */
export function canReceiveVLF(depth) {
  return depth <= env.propagation.vlfPenetrationDepth;
}

/**
 * Get the propagation path type between two entities at given depths
 * and range (nm). Returns the path with highest signal potential.
 *
 * @param {number} sourceDepth — source depth in metres
 * @param {number} receiverDepth — receiver depth in metres
 * @param {number} rangeNm — range in nautical miles
 * @param {number} waterDepth — water depth at midpoint (metres)
 * @returns {string} 'direct'|'duct'|'cz1'|'cz2'|'cz3'|'bottom_bounce'|'shadow'
 */
export function propagationPath(sourceDepth, receiverDepth, rangeNm, waterDepth) {
  const p = env.propagation;
  const srcAbove = sourceDepth <= p.layerDepth;
  const rcvAbove = receiverDepth <= p.layerDepth;

  // Both in the mixed layer — surface duct
  if (srcAbove && rcvAbove && rangeNm <= p.surfaceDuctRange) {
    return 'duct';
  }

  // Same layer (both above or both below) and within direct path range
  if (srcAbove === rcvAbove && rangeNm <= p.directPathRange) {
    return 'direct';
  }

  // Check convergence zones
  for (let i = 0; i < p.czRanges.length; i++) {
    const czR = p.czRanges[i];
    if (Math.abs(rangeNm - czR) <= p.czWidth / 2) {
      // CZ detection: source must be near surface or in duct,
      // receiver near surface (CZ sound returns to surface layer)
      if (srcAbove && rcvAbove) {
        return 'cz' + (i + 1);
      }
    }
  }

  // Bottom bounce — if water is shallow enough and bottom is reflective
  if (p.bottomBounceRange > 0 && rangeNm <= p.bottomBounceRange) {
    return 'bottom_bounce';
  }

  // Shadow zone — between direct path and CZ1
  if (rangeNm > p.shadowZoneStart && rangeNm < p.shadowZoneEnd) {
    // One or both below the layer, in the shadow zone
    if (!srcAbove || !rcvAbove) return 'shadow';
  }

  // Beyond all detection paths
  return 'shadow';
}

/**
 * Estimate transmission loss (dB) for a given path and range.
 * Simplified model: spherical spreading + absorption.
 *
 * @param {string} path — propagation path type
 * @param {number} rangeNm — range in nautical miles
 * @param {string} freqBand — 'vlf'|'lf'|'mf'|'hf'
 * @returns {number} transmission loss in dB (positive value)
 */
export function transmissionLoss(path, rangeNm, freqBand = 'lf') {
  const rangeM = rangeNm * 1852;
  if (rangeM < 1) return 0;

  const absorption = env.propagation.absorptionPerNm[freqBand] || 0.01;

  // Spherical spreading: TL = 20 log10(range_m)
  // Cylindrical spreading (ducted): TL = 10 log10(range_m) + 10 log10(duct_range)
  let spreadingLoss;

  switch (path) {
    case 'duct':
      // Cylindrical spreading in surface duct — less loss
      spreadingLoss = 10 * Math.log10(rangeM) + 30; // +30 for transition range
      break;
    case 'direct':
      spreadingLoss = 20 * Math.log10(rangeM);
      break;
    case 'cz1':
    case 'cz2':
    case 'cz3':
      // CZ: sound is refocused — treat as cylindrical at CZ range
      spreadingLoss = 10 * Math.log10(rangeM) + 35;
      break;
    case 'bottom_bounce':
      // Extra loss from bottom reflection
      spreadingLoss = 20 * Math.log10(rangeM) + 3; // +3dB per bounce
      break;
    case 'shadow':
      // Heavy loss in shadow zone — only diffracted/scattered energy
      spreadingLoss = 20 * Math.log10(rangeM) + 20;
      break;
    default:
      spreadingLoss = 20 * Math.log10(rangeM);
  }

  // Frequency-dependent absorption
  const absorptionLoss = absorption * rangeNm;

  return spreadingLoss + absorptionLoss;
}

/**
 * Get bottom reflectivity at a world position.
 *
 * @param {number} wx — world x
 * @param {number} wy — world y
 * @returns {number} 0-1 reflectivity coefficient
 */
export function bottomReflectivityAt(wx, wy) {
  return _bottomReflectivity(bottomTypeAt(wx, wy));
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function _randRange(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * Get average water depth from location bathymetry (for initial propagation calc).
 * Uses a simple sample of the grid centre region.
 */
function _averageWaterDepth(location) {
  if (!location?.bathymetry?.grid) return 1900;
  const grid = location.bathymetry.grid;
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  if (rows === 0 || cols === 0) return 1900;

  // Sample centre 20% of grid
  const r0 = Math.floor(rows * 0.4);
  const r1 = Math.floor(rows * 0.6);
  const c0 = Math.floor(cols * 0.4);
  const c1 = Math.floor(cols * 0.6);

  let sum = 0, n = 0;
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      if (grid[r][c] > 0) { sum += grid[r][c]; n++; }
    }
  }
  return n > 0 ? sum / n : 1900;
}
