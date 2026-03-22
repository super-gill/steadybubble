'use strict';

// ── Tile-Based Thermocline System ───────────────────────────────────────
// Generates a grid of thermocline tiles on scenario init. Each tile has
// independent thermocline parameters (top depth, thickness, temp drop,
// present/absent). Parameters are interpolated between tiles to create
// realistic horizontal variation — the player "hunts for the layer."
//
// Implements LAYER-GENERATION-GUIDANCE.md:
// - Seasonal base values with patchiness
// - Zone modifiers from local bathymetry
// - Sea state modifiers
// - Seabed clamp (layer can't extend into seabed)
// - Thickness ↔ gradient correlation
// - Smooth blending between tiles (10-20km transition zones)

import { clamp } from '../utils/math.js';
import { seabedDepthAt } from './ocean.js';

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TILE_SIZE_NM = 27;    // ~50km per tile (27nm ≈ 50km)
const WU_PER_NM = 185.2;
const TILE_SIZE_WU = TILE_SIZE_NM * WU_PER_NM;

// Minimum thermocline thickness before it's considered absent
const MIN_THICKNESS = 15; // metres

// ═══════════════════════════════════════════════════════════════════════════
// 2. TILE GRID STATE
// ═══════════════════════════════════════════════════════════════════════════

let _tiles = null;   // 2D array of tile objects
let _cols = 0;
let _rows = 0;
let _worldW = 0;
let _worldH = 0;

/**
 * A single thermocline tile.
 * @typedef {Object} ThermTile
 * @property {boolean} present - whether a thermocline exists in this tile
 * @property {number} topDepth - top of thermocline (metres)
 * @property {number} thickness - thermocline thickness (metres)
 * @property {number} tempDrop - temperature drop across thermocline (°C)
 * @property {number} gradient - °C/m through the thermocline (derived)
 * @property {number} bottomDepth - topDepth + thickness
 * @property {number} screenStrength - 0-1 acoustic effectiveness
 */

// ═══════════════════════════════════════════════════════════════════════════
// 3. GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate the thermocline tile grid for a scenario.
 * Called once on scenario init.
 *
 * @param {object} location - location data (with .thermocline, .bathymetry)
 * @param {string} season - 'winter'|'spring'|'summer'|'autumn'
 * @param {number} seaState - Beaufort sea state (0-9)
 * @param {number} worldSize - world size in world units
 */
export function generateThermoclineTiles(location, season, seaState, worldSize) {
  _worldW = worldSize;
  _worldH = worldSize;
  _cols = Math.ceil(worldSize / TILE_SIZE_WU);
  _rows = Math.ceil(worldSize / TILE_SIZE_WU);

  const params = location.thermocline?.[season];
  if (!params) {
    // No thermocline data — create empty grid
    _tiles = _emptyGrid(_rows, _cols);
    return;
  }

  // Sea state modifiers (from guidance doc)
  const ssMod = _seaStateModifier(seaState);

  _tiles = [];
  for (let r = 0; r < _rows; r++) {
    const row = [];
    for (let c = 0; c < _cols; c++) {
      const tile = _generateTile(params, ssMod, r, c, location);
      row.push(tile);
    }
    _tiles.push(row);
  }
}

/**
 * Generate a single tile.
 */
function _generateTile(params, ssMod, row, col, location) {
  // ── Pass 1: Absent check ──────────────────────────────────────────────
  const totalAbsentChance = clamp(params.absentChance + ssMod.absentMod, 0, 0.95);
  if (Math.random() < totalAbsentChance) {
    return _absentTile();
  }

  // ── Pass 1: Sample base values (normal distribution) ──────────────────
  let topDepth = _sampleNormal(params.topDepthRange[0], params.topDepthRange[1]);
  let thickness = _sampleNormal(params.thicknessRange[0], params.thicknessRange[1]);
  let tempDrop = _sampleNormal(params.tempDropRange[0], params.tempDropRange[1]);

  // ── Correlation: thin layers are sharper ──────────────────────────────
  const thickRange = params.thicknessRange[1] - params.thicknessRange[0];
  const thickNorm = (thickness - params.thicknessRange[0]) / Math.max(thickRange, 1);
  if (thickNorm < 0.25) {
    tempDrop *= 1.3; // thin → sharper gradient
  } else if (thickNorm > 0.75) {
    tempDrop *= 0.7; // thick → weaker gradient
  }

  // ── Pass 2: Sea state modifier ────────────────────────────────────────
  topDepth += ssMod.depthAdd;
  tempDrop *= ssMod.gradientMult;

  // ── Pass 2: Zone modifier from local bathymetry ───────────────────────
  const tileWX = (col + 0.5) * TILE_SIZE_WU;
  const tileWY = (row + 0.5) * TILE_SIZE_WU;
  const seabed = seabedDepthAt(tileWX, tileWY);

  if (seabed <= 0) {
    return _absentTile(); // land
  }

  const zoneMod = _zoneModifier(seabed);
  topDepth += zoneMod.topDepthMod;
  thickness *= zoneMod.thicknessMult;

  // ── Pass 2: Seabed clamp ──────────────────────────────────────────────
  const bottomDepth = topDepth + thickness;
  if (bottomDepth >= seabed - 20) {
    thickness = seabed - topDepth - 20;
  }

  // ── Final validation ──────────────────────────────────────────────────
  if (thickness < MIN_THICKNESS || tempDrop < 1.0 || topDepth >= seabed - 40) {
    return _absentTile();
  }

  // Clamp to reasonable values
  topDepth = Math.max(15, Math.round(topDepth));
  thickness = Math.max(MIN_THICKNESS, Math.round(thickness));
  tempDrop = Math.max(0.5, Math.round(tempDrop * 10) / 10);

  const gradient = -tempDrop / thickness; // °C/m (negative = cooling with depth)
  const screenStrength = _acousticScreen(tempDrop);

  return {
    present: true,
    topDepth,
    thickness,
    tempDrop,
    gradient,
    bottomDepth: topDepth + thickness,
    screenStrength,
  };
}

function _absentTile() {
  return {
    present: false,
    topDepth: 0,
    thickness: 0,
    tempDrop: 0,
    gradient: 0,
    bottomDepth: 0,
    screenStrength: 0,
  };
}

function _emptyGrid(rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(_absentTile());
    grid.push(row);
  }
  return grid;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SEA STATE MODIFIER
// ═══════════════════════════════════════════════════════════════════════════

function _seaStateModifier(ss) {
  if (ss <= 2) return { depthAdd: 0,   gradientMult: 1.0,  absentMod: -0.05 };
  if (ss <= 4) return { depthAdd: _randRange(20, 40),  gradientMult: 0.85, absentMod: 0 };
  if (ss <= 6) return { depthAdd: _randRange(60, 100), gradientMult: 0.60, absentMod: 0.15 };
  if (ss <= 8) return { depthAdd: _randRange(100,180), gradientMult: 0.30, absentMod: 0.30 };
  return            { depthAdd: _randRange(180,250), gradientMult: 0.10, absentMod: 0.55 };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. ZONE MODIFIER (from bathymetry depth)
// ═══════════════════════════════════════════════════════════════════════════

function _zoneModifier(seabed) {
  // Shallow shelf — no thermocline possible
  if (seabed < 200)  return { topDepthMod: 0, thicknessMult: 0, zone: 'shelf' };
  // Ridge crest — compressed, may not fit
  if (seabed < 500)  return { topDepthMod: 0, thicknessMult: 0.6, zone: 'ridge_crest' };
  // Ridge flanks — slightly modified
  if (seabed < 900)  return { topDepthMod: 20, thicknessMult: 0.8, zone: 'ridge_flank' };
  // Faroe-Shetland Channel
  if (seabed < 1000) return { topDepthMod: 15, thicknessMult: 0.85, zone: 'channel' };
  // Iceland Basin / deep water — full thermocline
  if (seabed < 2200) return { topDepthMod: 0, thicknessMult: 1.0, zone: 'iceland_basin' };
  // Norwegian Sea — slightly deeper, colder
  return               { topDepthMod: -10, thicknessMult: 1.0, zone: 'norwegian_sea' };
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. ACOUSTIC SCREEN (temp drop → effectiveness)
// ═══════════════════════════════════════════════════════════════════════════

function _acousticScreen(tempDrop) {
  if (tempDrop >= 5.0) return 1.0;   // strong
  if (tempDrop >= 3.0) return 0.7;   // moderate
  if (tempDrop >= 1.0) return 0.35;  // weak
  return 0;                           // absent
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. INTERPOLATED QUERY (smooth blending between tiles)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get interpolated thermocline parameters at a world position.
 * Blends between the 4 nearest tile centres for smooth transitions.
 *
 * @param {number} wx - world x
 * @param {number} wy - world y
 * @returns {ThermTile} interpolated parameters
 */
export function thermoclineAt(wx, wy) {
  if (!_tiles || _cols === 0) return _absentTile();

  // Continuous tile position
  const cx = wx / TILE_SIZE_WU - 0.5;
  const cy = wy / TILE_SIZE_WU - 0.5;

  const c0 = Math.floor(cx);
  const r0 = Math.floor(cy);
  const fx = cx - c0;
  const fy = cy - r0;

  // Fetch 4 corners (clamped to grid bounds)
  const t00 = _getTile(r0, c0);
  const t10 = _getTile(r0, c0 + 1);
  const t01 = _getTile(r0 + 1, c0);
  const t11 = _getTile(r0 + 1, c0 + 1);

  // Count how many corners are present
  const presentCount = (t00.present ? 1 : 0) + (t10.present ? 1 : 0)
                     + (t01.present ? 1 : 0) + (t11.present ? 1 : 0);

  // If no tiles have a layer, it's absent
  if (presentCount === 0) return _absentTile();

  // Bilinear weights
  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;

  // Weighted average of present tiles only (absent tiles contribute 0 weight)
  let wSum = 0;
  let topDepth = 0, thickness = 0, tempDrop = 0, screenStrength = 0;

  if (t00.present) { topDepth += t00.topDepth * w00; thickness += t00.thickness * w00; tempDrop += t00.tempDrop * w00; screenStrength += t00.screenStrength * w00; wSum += w00; }
  if (t10.present) { topDepth += t10.topDepth * w10; thickness += t10.thickness * w10; tempDrop += t10.tempDrop * w10; screenStrength += t10.screenStrength * w10; wSum += w10; }
  if (t01.present) { topDepth += t01.topDepth * w01; thickness += t01.thickness * w01; tempDrop += t01.tempDrop * w01; screenStrength += t01.screenStrength * w01; wSum += w01; }
  if (t11.present) { topDepth += t11.topDepth * w11; thickness += t11.thickness * w11; tempDrop += t11.tempDrop * w11; screenStrength += t11.screenStrength * w11; wSum += w11; }

  if (wSum < 0.01) return _absentTile();

  // Normalise by weight of present tiles
  topDepth /= wSum;
  thickness /= wSum;
  tempDrop /= wSum;
  screenStrength /= wSum;

  // Scale screen strength by fraction of surrounding tiles that are present
  // — at the edge of a gap, effectiveness fades
  const presenceFraction = wSum;
  screenStrength *= presenceFraction;

  // Below minimum effective → absent
  if (thickness < MIN_THICKNESS || tempDrop < 0.8 || screenStrength < 0.05) {
    return _absentTile();
  }

  const gradient = -tempDrop / thickness;

  return {
    present: true,
    topDepth: Math.round(topDepth),
    thickness: Math.round(thickness),
    tempDrop: Math.round(tempDrop * 10) / 10,
    gradient,
    bottomDepth: Math.round(topDepth + thickness),
    screenStrength: Math.round(screenStrength * 100) / 100,
  };
}

function _getTile(r, c) {
  const cr = clamp(r, 0, _rows - 1);
  const cc = clamp(c, 0, _cols - 1);
  return _tiles[cr]?.[cc] || _absentTile();
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. DEBUG / ACCESSORS
// ═══════════════════════════════════════════════════════════════════════════

/** Get the raw tile grid (for dev panel / debug rendering). */
export function getTileGrid() { return _tiles; }

/** Get tile grid dimensions. */
export function getTileDimensions() {
  return { rows: _rows, cols: _cols, tileSizeWU: TILE_SIZE_WU, tileSizeNm: TILE_SIZE_NM };
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sample from a normal distribution clamped to [min, max].
 * Uses Box-Muller transform. Mean = midpoint, SD = range/6 (99.7% within range).
 */
function _sampleNormal(min, max) {
  const mean = (min + max) / 2;
  const sd = (max - min) / 6;
  let u, v, s;
  do {
    u = Math.random() * 2 - 1;
    v = Math.random() * 2 - 1;
    s = u * u + v * v;
  } while (s >= 1 || s === 0);
  const z = u * Math.sqrt(-2 * Math.log(s) / s);
  return clamp(mean + z * sd, min, max);
}

function _randRange(min, max) {
  return min + Math.random() * (max - min);
}
