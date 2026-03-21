'use strict';

// ── Vessel Layout Dispatcher ────────────────────────────────────────────
// Returns the complete layout data for a given vessel key.
// Each layout module exports: COMPS, COMP_DEF, ROOMS, SYS_DEF, TRAVEL,
// WTD_PAIRS, WTD_RC_KEYS, EVAC_TO, SECTION_LABEL, SECTION_SHORT,
// SECTION_CAP, COMP_FRACS, COMP_LABELS, EXTERNALS, HIGH_ENERGY_SYS,
// PASSIVE_SYS, TRIM_LEVERS

import * as layout688 from './layout-688.js';
import * as layoutTrafalgar from './layout-trafalgar.js';
import * as layoutSeawolf from './layout-seawolf.js';
import * as layoutType209 from './layout-type209.js';
import * as layoutLegacy from './layout-legacy.js';

const LAYOUTS = {
  '688':       layout688,
  '688i':      layout688,
  'trafalgar': layoutTrafalgar,
  'swiftsure': layoutTrafalgar,
  'seawolf':   layoutSeawolf,
  'type209':   layoutType209,
};

/**
 * Get layout data for a vessel key.
 * @param {string} vesselKey — e.g. '688', '688i', 'trafalgar'
 * @returns {object} layout module with all compartment/room/system definitions
 */
export function getLayout(vesselKey) {
  return LAYOUTS[vesselKey] || layoutLegacy;
}
