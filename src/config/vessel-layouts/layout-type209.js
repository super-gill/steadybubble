'use strict';

// ── Type 209 Diesel-Electric — 3 Watertight Sections, 2 Decks ──────────
// Source: Jason's schematic, confirmed 2026-03-21
// Small diesel-electric boat. 8 torpedo tubes, 14 weapons. 35 crew.
// 2 decks: upper (full height) and lower (half height — hull taper).
// Batteries are full-sized compartments across the lower deck.
// No reactor — diesel engines + electric motor for propulsion.

export const COMPS = ['forward', 'midships', 'aft'];

export const COMP_DEF = {
  forward:  { label:'FORWARD COMP',  crewCount:12, volume:4, tower:'fwd', unmanned:false },
  midships: { label:'MIDSHIPS',      crewCount:14, volume:5, tower:'fwd', unmanned:false },
  aft:      { label:'AFT COMP',      crewCount:9,  volume:5, tower:'aft', unmanned:false },
};

export const SECTION_LABEL = {
  forward:  'WATERTIGHT SECTION 1',
  midships: 'WATERTIGHT SECTION 2',
  aft:      'WATERTIGHT SECTION 3',
};

export const SECTION_SHORT = {
  forward:'WTS1', midships:'WTS2', aft:'WTS3',
};

// Forward: cols 28-37 = 10 cols, Midships: 15-26 = 12 cols, Aft: 2-13 = 12 cols
export const COMP_FRACS = [0.29, 0.36, 0.35];
export const COMP_LABELS = ['WTS 1', 'WTS 2', 'WTS 3'];

// Deck height ratios: upper deck is full height, lower is half
// Used by render-damage-screen.js for non-uniform deck rendering
export const DECK_HEIGHTS = [2, 1]; // relative heights: upper=2, lower=1

export const WTD_PAIRS = [
  ['forward', 'midships'],
  ['midships', 'aft'],
];
export const WTD_RC_KEYS = new Set(); // no reactor bypass on diesel boats

export const TRAVEL = {
  forward:  { forward:0,  midships:8,  aft:18 },
  midships: { forward:8,  midships:0,  aft:8  },
  aft:      { forward:18, midships:8,  aft:0  },
};

export const EVAC_TO = {
  forward:  ['midships'],
  midships: ['forward', 'aft'],
  aft:      ['midships'],
};

export const SECTION_CAP = 30;

// ── Watchspace (Room) definitions ───────────────────────────────────────
// 2 decks. col: 0=bow, increasing=aft. Upper deck is crew/ops, lower is batteries/storage.
export const ROOMS = {
  // ── WTS 1 — Forward ──────────────────────────────────────────────────
  fwd_crew_mess:   { label:'CREW MESS',          section:'forward', deck:0, col:1, colSpan:1, crew:4,  detectionDelay:0  },
  fwd_torpedo:     { label:'TORPEDO ROOM',       section:'forward', deck:0, col:0, colSpan:1, crew:4,  detectionDelay:0  },
  fwd_battery:     { label:'BATTERY BANK',       section:'forward', deck:1, col:1, colSpan:1, crew:0,  detectionDelay:50 },
  fwd_torp_stow:   { label:'TORPEDO STORAGE',    section:'forward', deck:1, col:0, colSpan:1, crew:0,  detectionDelay:40 },

  // ── WTS 2 — Midships ─────────────────────────────────────────────────
  mid_elec:        { label:'ELEC DISTRIBUTION',  section:'midships', deck:0, col:2, colSpan:1, crew:1,  detectionDelay:0  },
  mid_ctrlsonar:   { label:'CONTROL / SONAR',    section:'midships', deck:0, col:1, colSpan:1, crew:8,  detectionDelay:0  },
  mid_wardroom:    { label:'WARDROOM',           section:'midships', deck:0, col:0, colSpan:1, crew:3,  detectionDelay:0  },
  mid_batt_aft:    { label:'BATTERY BANK',       section:'midships', deck:1, col:2, colSpan:1, crew:0,  detectionDelay:50 },
  mid_batt_mid:    { label:'BATTERY BANK',       section:'midships', deck:1, col:1, colSpan:1, crew:0,  detectionDelay:50 },
  mid_batt_fwd:    { label:'BATTERY BANK',       section:'midships', deck:1, col:0, colSpan:1, crew:0,  detectionDelay:50 },

  // ── WTS 3 — Aft ──────────────────────────────────────────────────────
  aft_motor:       { label:'ELECTRIC MOTOR',     section:'aft', deck:0, col:2, colSpan:1, crew:2,  detectionDelay:0  },
  aft_diesel_aft:  { label:'DIESEL ENGINES',     section:'aft', deck:0, col:1, colSpan:1, crew:2,  detectionDelay:0  },
  aft_diesel_fwd:  { label:'DIESEL ENGINES',     section:'aft', deck:0, col:0, colSpan:1, crew:2,  detectionDelay:0  },
  // Lower deck empty under motor (hull taper), batteries under diesels
  aft_batt_aft:    { label:'BATTERY BANK',       section:'aft', deck:1, col:1, colSpan:1, crew:0,  detectionDelay:50 },
  aft_batt_fwd:    { label:'BATTERY BANK',       section:'aft', deck:1, col:0, colSpan:1, crew:0,  detectionDelay:50 },
};

// ── System definitions ──────────────────────────────────────────────────
export const SYS_DEF = {
  // ── WTS 1 — Forward ─────────────────────────────────────────────────
  tubes:          { label:'TORPEDO TUBES',     room:'fwd_torpedo',    ctrl:'fire_ctrl' },
  weapon_stow:    { label:'WEAPON STOWAGE',    room:'fwd_torp_stow'  },
  fwd_trim:       { label:'FWD TRIM TANK',     room:'fwd_torpedo'    },
  fwd_escape:     { label:'FWD ESCAPE TRUNK',  room:'fwd_torpedo'    },

  // ── WTS 2 — Midships ────────────────────────────────────────────────
  sonar_hull:     { label:'SONAR ARRAY',       room:'mid_ctrlsonar'  },
  tma:            { label:'TMA',               room:'mid_ctrlsonar'  },
  tdc_comp:       { label:'TDC COMPUTER',      room:'mid_ctrlsonar', ctrl:'fire_ctrl' },
  fire_ctrl:      { label:'FIRE CONTROL',      room:'mid_ctrlsonar'  },
  helm:           { label:'HELM',              room:'mid_ctrlsonar'  },
  ballast:        { label:'BALLAST CTRL',      room:'mid_ctrlsonar'  },
  nav_sys:        { label:'NAVIGATION',        room:'mid_ctrlsonar'  },
  periscope:      { label:'PERISCOPE',         room:'mid_ctrlsonar'  },
  comms_mast:     { label:'COMMS MAST',        room:'mid_ctrlsonar'  },
  elec_dist:      { label:'ELEC DISTRIBUTION', room:'mid_elec'       },
  hyd_main:       { label:'MAIN HYD PLANT',    room:'mid_elec'       },
  planes_fwd_hyd: { label:'FWD PLANES HYD',    room:'mid_ctrlsonar', ctrl:'helm' },
  co2_scrubbers:  { label:'CO2 SCRUBBERS',     room:'mid_elec'       },
  o2_gen:         { label:'O2 GENERATOR',      room:'mid_elec'       },
  vent_plant:     { label:'VENT PLANT',        room:'mid_elec'       },
  aux_power:      { label:'AUX POWER PANEL',   room:'mid_elec'       },

  // ── Watertight Doors ────────────────────────────────────────────────
  wtd_fwd_mid:    { label:'WTD 1 (FWD/MID)',   room:'fwd_crew_mess', isWTD:true, wtdKey:'forward|midships' },
  wtd_mid_aft:    { label:'WTD 2 (MID/AFT)',   room:'mid_elec',      isWTD:true, wtdKey:'midships|aft' },

  // ── WTS 3 — Aft ─────────────────────────────────────────────────────
  diesel_engine:  { label:'DIESEL ENGINE',     room:'aft_diesel_aft', dieselOnly:true },
  alternator:     { label:'ALTERNATOR',        room:'aft_diesel_fwd', dieselOnly:true },
  main_motor:     { label:'MAIN MOTOR',        room:'aft_motor',      dieselOnly:true },
  propulsion:     { label:'PROPULSION',        room:'aft_motor'      },
  steering:       { label:'STEERING',          room:'aft_motor'      },
  planes_aft_hyd: { label:'AFT PLANES HYD',    room:'aft_motor'      },
  shaft_seals:    { label:'SHAFT SEALS',       room:'aft_motor'      },
  aft_trim:       { label:'AFT TRIM TANK',     room:'aft_motor'      },

  // ── Battery banks (all sections) ────────────────────────────────────
  battery_bank_1: { label:'BATTERY 1',         room:'aft_batt_aft'   },
  battery_bank_2: { label:'BATTERY 2',         room:'aft_batt_fwd'   },
  battery_bank_3: { label:'BATTERY 3',         room:'mid_batt_aft'   },
  battery_bank_4: { label:'BATTERY 4',         room:'mid_batt_mid'   },
  battery_bank_5: { label:'BATTERY 5',         room:'mid_batt_fwd'   },
  battery_bank_6: { label:'BATTERY 6',         room:'fwd_battery'    },
};

export const EXTERNALS = {
  bow_array:  { label:'BOW ARRAY',   position:'bow' },
  propshaft:  { label:'PROPSHAFT',   position:'stern' },
};

export const HIGH_ENERGY_SYS = new Set(['propulsion','diesel_engine','main_motor']);
export const PASSIVE_SYS = new Set(['fwd_escape','fwd_trim','aft_trim','shaft_seals']);
export const TRIM_LEVERS = { forward:-1.5, midships:0.0, aft:1.5 };
