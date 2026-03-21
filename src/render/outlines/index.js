'use strict';

// ── DC Panel Outline Dispatcher ─────────────────────────────────────────
// Returns the outline draw function for the given vessel key.
// Each outline function draws the hull shape and external equipment,
// and returns geometry data used by render-dc.js for compartment fills.

import { draw688Outline } from './outline-688.js';

const OUTLINES = {
  '688':  draw688Outline,
  '688i': draw688Outline,
  'trafalgar': draw688Outline,
  'swiftsure': draw688Outline,
  'seawolf':   draw688Outline,
  'type209':   draw688Outline,  // same hull outline style (pill + external equipment)
  // Legacy vessels use null — render-dc.js falls back to the generic pill
};

/**
 * Get the outline draw function for a vessel key.
 * @param {string} vesselKey
 * @returns {Function|null} outline draw function, or null for generic pill fallback
 */
export function getOutline(vesselKey) {
  return OUTLINES[vesselKey] || null;
}
