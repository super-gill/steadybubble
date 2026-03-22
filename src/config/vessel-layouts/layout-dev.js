'use strict';

// ── Dev Test Submarine — Minimal Layout ──────────────────────────────────
// Single compartment, no systems, no weapons. For testing world-scale
// navigation, bathymetry, grounding, and ocean model.

export const COMPS = ['hull'];

export const COMP_DEF = {
  hull: { label:'TEST HULL', crewCount:5, volume:4, tower:null, unmanned:false },
};

export const SECTION_LABEL = { hull:'HULL' };
export const SECTION_SHORT = { hull:'HULL' };
export const COMP_FRACS = [1.0];
export const COMP_LABELS = ['HULL'];

export const WTD_PAIRS = [];
export const WTD_RC_KEYS = new Set();

export const TRAVEL = { hull:{ hull:0 } };
export const EVAC_TO = { hull:[] };
export const SECTION_CAP = 10;

export const ROOMS = {
  dev_bridge: { label:'BRIDGE', section:'hull', deck:0, col:0, colSpan:2, crew:5, detectionDelay:0 },
};

export const SYS_DEF = {
  helm:    { label:'HELM',       room:'dev_bridge' },
  ballast: { label:'BALLAST CTRL', room:'dev_bridge' },
};

export const EXTERNALS = {};
export const HIGH_ENERGY_SYS = new Set();
export const PASSIVE_SYS = new Set();
export const TRIM_LEVERS = { hull:0 };
