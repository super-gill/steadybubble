'use strict';

// ── Ocean Environment System ─────────────────────────────────────────────
// Provides bathymetry lookup, terrain collision detection, and
// depth-under-keel tracking from the active location data.

import { player, world } from '../state/sim-state.js';
import { session } from '../state/session-state.js';

let _location = null;  // active location data (set by setLocation)
let _comms = null;

export function setOceanLocation(location) { _location = location; }
export function setOceanComms(comms) { _comms = comms; }

// ── Bathymetry lookup ────────────────────────────────────────────────────

/**
 * Get seabed depth (metres) at a world position.
 * Returns the depth from the bathymetry grid, or a default if no location loaded.
 * Negative values = land (above sea level).
 */
export function seabedDepthAt(wx, wy) {
  if (!_location?.bathymetry?.grid) return world.ground || 1900;
  const bathy = _location.bathymetry;
  const res = bathy.resolution || 185.2;
  const grid = bathy.grid;

  // Continuous position within the grid
  const cx = wx / res;
  const cy = wy / res;

  // Integer cell coordinates
  const c0 = Math.floor(cx);
  const r0 = Math.floor(cy);

  // Out of bounds — use default
  if (r0 < 0 || r0 >= bathy.rows - 1 || c0 < 0 || c0 >= bathy.cols - 1) {
    // Edge cells — no interpolation, just clamp
    const cr = Math.max(0, Math.min(bathy.rows - 1, r0));
    const cc = Math.max(0, Math.min(bathy.cols - 1, c0));
    return grid[cr]?.[cc] ?? (world.ground || 1900);
  }

  // Fractional position within the cell (0-1)
  const fx = cx - c0;
  const fy = cy - r0;

  // Bilinear interpolation between 4 corner cells
  const d00 = grid[r0][c0];
  const d10 = grid[r0][c0 + 1];
  const d01 = grid[r0 + 1][c0];
  const d11 = grid[r0 + 1][c0 + 1];

  const top = d00 + (d10 - d00) * fx;
  const bot = d01 + (d11 - d01) * fx;
  return top + (bot - top) * fy;
}

/**
 * Check if a world position is land (impassable).
 */
export function isLand(wx, wy) {
  if (!_location?.land?.mask) return false;
  const res = _location.bathymetry?.resolution || 185.2;
  const col = Math.floor(wx / res);
  const row = Math.floor(wy / res);
  if (row < 0 || row >= _location.bathymetry.rows || col < 0 || col >= _location.bathymetry.cols) {
    return false;
  }
  return _location.land.mask[row]?.[col] || false;
}

/**
 * Get bottom type at a world position.
 * Returns 'rock'|'sand'|'mud'|'mixed'.
 */
export function bottomTypeAt(wx, wy) {
  if (!_location?.bottom?.grid) return 'mud';
  const res = _location.bathymetry?.resolution || 185.2;
  const col = Math.floor(wx / res);
  const row = Math.floor(wy / res);
  if (row < 0 || row >= _location.bathymetry.rows || col < 0 || col >= _location.bathymetry.cols) {
    return 'mud';
  }
  return _location.bottom.grid[row]?.[col] || 'mud';
}

// ── Depth under keel ─────────────────────────────────────────────────────

const DUK_WARN_50  = 50;   // first warning
const DUK_WARN_20  = 20;   // urgent
const DUK_WARN_10  = 10;   // collision alarm
const DRAFT_SSN    = 12;   // metres — nuclear submarine draft
const DRAFT_SSK    = 8;    // metres — conventional submarine draft

let _lastDUKBand = 'safe';
let _groundingState = null;

/**
 * Tick depth-under-keel warnings and terrain collision.
 * Called every frame from the main sim tick.
 */
export function tickOcean(dt) {
  if (!player || player.depth == null) return;

  const seabed = seabedDepthAt(player.wx, player.wy);
  const draft = player._isDiesel ? DRAFT_SSK : DRAFT_SSN;
  const duk = seabed - player.depth - draft;

  player.seabedDepth = seabed;
  player.depthUnderKeel = Math.max(0, duk);

  // Auto-clear grounding if sub has moved to deeper water
  if (_groundingState && duk > 20) {
    _groundingState = null;
    _lastDUKBand = 'safe';
  }

  // Land collision — submarine enters a land cell
  if (isLand(player.wx, player.wy) && player.depth < 20) {
    _triggerGrounding('severe', player.speed, dt);
    return;
  }

  // Depth-under-keel warnings
  const band = duk <= 0 ? 'ground' : duk <= DUK_WARN_10 ? 'critical' : duk <= DUK_WARN_20 ? 'urgent' : duk <= DUK_WARN_50 ? 'warn' : 'safe';

  if (band !== _lastDUKBand) {
    if (band === 'warn' && _lastDUKBand === 'safe') {
      _comms?.nav?.depthReport?.(`bottom rising — depth under keel ${Math.round(duk)} metres`);
    } else if (band === 'urgent') {
      _comms?.nav?.depthReport?.(`shoal water — depth under keel ${Math.round(duk)} metres`);
    } else if (band === 'critical') {
      _comms?.nav?.depthReport?.(`collision alarm — depth under keel ${Math.round(duk)} metres`);
    } else if (band === 'ground') {
      _triggerGrounding(
        player.speed > 10 ? 'severe' : player.speed > 3 ? 'hard' : 'gentle',
        player.speed, dt
      );
    }
    _lastDUKBand = band;
  }
}

// ── Grounding ────────────────────────────────────────────────────────────

function _triggerGrounding(severity, speed, dt) {
  if (_groundingState) return; // already grounded

  _groundingState = { severity, speed, t: 0 };

  // Stop the boat
  player.speed = 0;
  player.speedOrderKts = 0;

  // Comms
  _comms?.nav?.grounded?.();

  // Damage depends on severity
  // This will be wired into the damage system via lazy binding
  if (_groundingDamageFn) _groundingDamageFn(severity, speed);
}

let _groundingDamageFn = null;
export function setGroundingDamageFn(fn) { _groundingDamageFn = fn; }

/**
 * Check if the player is currently grounded.
 */
export function isGrounded() { return _groundingState != null; }

/**
 * Clear grounding state (after emergency blow or reverse).
 */
export function clearGrounding() {
  _groundingState = null;
  _lastDUKBand = 'safe';
}

// ── Location accessors ───────────────────────────────────────────────────

export function activeLocation() { return _location; }
export function locationName() { return _location?.name || 'Unknown'; }
export function locationSVP(season) { return _location?.svp?.[season] || _location?.svp?.winter || null; }
export function locationWeather(season) { return _location?.weather?.[season] || _location?.weather?.winter || null; }
