'use strict';

import { CONFIG } from '../../config/constants.js';
import { getLayout } from '../../config/vessel-layouts/index.js';

const C = CONFIG;

// ── Vessel-specific data (mutable — updated by setLayout) ───────────────
// These are ES6 live bindings: importers always see the current value.
export let COMPS = [];
export let COMP_DEF = {};
export let SYS_DEF = {};
export let ROOMS = {};
export let TRAVEL = {};
export let WTD_PAIRS = [];
export let WTD_RC_KEYS = new Set();
export let EVAC_TO = {};
export let SECTION_CAP = 54;
export let SECTION_LABEL = {};
export let SECTION_SHORT = {};
export let EXTERNALS = {};
export let HIGH_ENERGY_SYS = new Set();
export let PASSIVE_SYS = new Set();
export let TRIM_LEVERS = {};

// DC panel layout data
export let COMP_FRACS = [];
export let COMP_LABELS = [];

// ── Derived lookups (rebuilt by setLayout) ───────────────────────────────
export let SYS_LABEL = {};
export let ALL_SYS = [];
export let ROOM_IDS = [];
export let SECTION_ROOMS = {};
export let SECTION_SYSTEMS = {};
export let DIESEL_SECTION_SYSTEMS = {};
export let ROOM_SYSTEMS = {};
export let ROOM_ADJ = {};

// ── Constants (not vessel-specific) ─────────────────────────────────────
export const STATES = ['nominal','degraded','offline','destroyed'];
export const REPAIR_TIME = { degraded:20, offline:45, destroyed:120 };

// ── Fire constants ──────────────────────────────────────────────────────
export const FIRE_BASE_GROW   = 0.014;   // growth/s at fireLevel=0 (was 0.008)
export const FIRE_SCALE_GROW  = 0.036;   // additional growth/s at fireLevel=1 (was 0.022, max grow ~0.050/s)
export const WATCH_SUPPRESS   = 0.010;
export const DC_FIRE_SUPPRESS = 0.043;   // DC team suppression/s — matches fire growth at ~80% (stall point)
export const FIRE_EVAC_TIME   = 15;
export const FIRE_DETECT_THRESHOLD  = 0.40;
export const FIRE_INVESTIGATE_DELAY = 12;
export const DRENCH_THRESH    = 0.95;
export const DRENCH_LOSE_TIME = 15;
export const DRENCH_FILL_TIME = 12;
export const VENT_N2_TIME     = 30;

// ── Depth flooding cascade constants ────────────────────────────────────
export const SEEP_RATE  = 0.004;
export const SEEP_DELAY_MIN = 30;
export const SEEP_DELAY_MAX = 90;

// ── setLayout: load vessel-specific data and rebuild derived lookups ────
export function setLayout(vesselKey) {
  const L = getLayout(vesselKey);

  // Primary data from layout
  COMPS         = L.COMPS;
  COMP_DEF      = L.COMP_DEF;
  SYS_DEF       = L.SYS_DEF;
  ROOMS         = L.ROOMS;
  TRAVEL        = L.TRAVEL;
  WTD_PAIRS     = L.WTD_PAIRS;
  WTD_RC_KEYS   = L.WTD_RC_KEYS;
  EVAC_TO       = L.EVAC_TO;
  SECTION_CAP   = L.SECTION_CAP;
  SECTION_LABEL = L.SECTION_LABEL;
  SECTION_SHORT = L.SECTION_SHORT;
  EXTERNALS     = L.EXTERNALS || {};
  HIGH_ENERGY_SYS = L.HIGH_ENERGY_SYS;
  PASSIVE_SYS   = L.PASSIVE_SYS;
  TRIM_LEVERS   = L.TRIM_LEVERS;
  COMP_FRACS    = L.COMP_FRACS;
  COMP_LABELS   = L.COMP_LABELS;

  // ── Rebuild derived lookups ───────────────────────────────────────────
  SYS_LABEL = Object.fromEntries(Object.entries(SYS_DEF).map(([k,v])=>[k,v.label]));
  ALL_SYS = Object.keys(SYS_DEF);
  ROOM_IDS = Object.keys(ROOMS);

  // Section → room list
  SECTION_ROOMS = {};
  for(const [id,r] of Object.entries(ROOMS)){
    if(!SECTION_ROOMS[r.section]) SECTION_ROOMS[r.section]=[];
    SECTION_ROOMS[r.section].push(id);
  }

  // Systems per section (nuclear vs diesel)
  SECTION_SYSTEMS = {};
  DIESEL_SECTION_SYSTEMS = {};
  ROOM_SYSTEMS = {};
  for(const [sys, def] of Object.entries(SYS_DEF)){
    const sec = ROOMS[def.room]?.section;
    if(!sec) continue;
    if(!def.dieselOnly){
      if(!SECTION_SYSTEMS[sec]) SECTION_SYSTEMS[sec] = [];
      SECTION_SYSTEMS[sec].push(sys);
    }
    if(!def.nuclearOnly){
      if(!DIESEL_SECTION_SYSTEMS[sec]) DIESEL_SECTION_SYSTEMS[sec] = [];
      DIESEL_SECTION_SYSTEMS[sec].push(sys);
    }
    if(!ROOM_SYSTEMS[def.room]) ROOM_SYSTEMS[def.room] = [];
    ROOM_SYSTEMS[def.room].push(sys);
  }

  // Room adjacency (fire spread / DC traversal within a section)
  // Two rooms are adjacent if they're in the same section AND physically touching:
  //   - Same deck + column ranges overlap or touch (horizontal neighbours)
  //   - Adjacent decks + column ranges overlap (vertical neighbours, sharing a floor/ceiling)
  // Falls back to deck-only adjacency for rooms without col/colSpan data (legacy layouts).
  ROOM_ADJ = {};
  function _colRange(r){ return r.colSpan!=null ? [r.col, r.col+r.colSpan-1] : null; }
  function _colsTouch(a,b){
    const ra=_colRange(a), rb=_colRange(b);
    if(!ra||!rb) return true; // no column data = treat as adjacent (legacy fallback)
    // Overlap: ranges intersect OR are exactly adjacent (touching walls)
    return ra[0]<=rb[1]+1 && rb[0]<=ra[1]+1;
  }
  function _colsOverlap(a,b){
    const ra=_colRange(a), rb=_colRange(b);
    if(!ra||!rb) return true;
    return ra[0]<=rb[1] && rb[0]<=ra[1];
  }
  for(const [id,r] of Object.entries(ROOMS)){
    ROOM_ADJ[id]=[];
    for(const [otherId,o] of Object.entries(ROOMS)){
      if(id===otherId) continue;
      if(r.section!==o.section) continue;
      const sameDeck=r.deck===o.deck;
      const adjDeck=Math.abs(r.deck-o.deck)===1;
      if(sameDeck && _colsTouch(r,o)) ROOM_ADJ[id].push(otherId);
      else if(adjDeck && _colsOverlap(r,o)) ROOM_ADJ[id].push(otherId);
    }
  }
}

// ── Helper functions ────────────────────────────────────────────────────
export function activeSystems(comp){
  return (C.player.isDiesel ? DIESEL_SECTION_SYSTEMS : SECTION_SYSTEMS)[comp] || [];
}

export function compLabel(comp){
  const _DIESEL_COMP_LABEL = { reactor_comp:'ENGINE COMP', reactor:'ENGINE COMP', engine_room:'MOTOR ROOM', engineering:'MOTOR ROOM' };
  return (C.player.isDiesel && _DIESEL_COMP_LABEL[comp]) || COMP_DEF[comp]?.label || comp;
}

export function roomSection(roomId){ return ROOMS[roomId]?.section; }

export function _sectionNoEvac(sec){ return (SECTION_ROOMS[sec]||[]).some(rid=>ROOMS[rid].noEvac); }

// ── Initialize with legacy layout (backward compatibility) ──────────────
// This ensures the module works immediately on import for non-688 vessels.
// setLayout() is called again when the player selects a vessel.
setLayout('trafalgar');
