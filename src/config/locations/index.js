'use strict';

// ── Location Dispatcher ────────────────────────────────────────────────
// Returns the complete location data for a given location key.
// Each location module exports: LOCATION object with bathymetry, land,
// bottom type, SVP profiles, weather, and shipping density.

import { LOCATION as giukGap } from './giuk-gap.js';

const LOCATIONS = {
  'giuk_gap': giukGap,
};

/**
 * Get location data by key.
 * @param {string} locationKey — e.g. 'giuk_gap'
 * @returns {object} location data module
 */
export function getLocation(locationKey) {
  return LOCATIONS[locationKey] || giukGap; // default to GIUK Gap
}

/** List available location keys. */
export function locationKeys() {
  return Object.keys(LOCATIONS);
}
