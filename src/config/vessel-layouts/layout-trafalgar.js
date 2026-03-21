'use strict';

// ── Trafalgar & Swiftsure Class — 3 Watertight Sections ────────────────
// Source: Jason's schematic, confirmed 2026-03-21
// Both Trafalgar and Swiftsure share this identical internal layout.
// Differences are in vessels.js config (speed, noise, weapons, depth, sonar).

// ── Compartment (Watertight Section) definitions ────────────────────────
export const COMPS = ['forward', 'reactor', 'engineering'];

export const COMP_DEF = {
  forward:     { label:'FORWARD COMPARTMENT', crewCount:94, volume:12, tower:'fwd', unmanned:false },
  reactor:     { label:'REACTOR COMP',        crewCount:3,  volume:3,  tower:null,  unmanned:false },
  engineering: { label:'ENGINEERING',         crewCount:28, volume:8,  tower:'aft', unmanned:false },
};

// ── Section display labels ──────────────────────────────────────────────
export const SECTION_LABEL = {
  forward:     'WATERTIGHT SECTION 1',
  reactor:     'WATERTIGHT SECTION 2',
  engineering: 'WATERTIGHT SECTION 3',
};

export const SECTION_SHORT = {
  forward:'WTS1', reactor:'WTS2', engineering:'WTS3',
};

// ── DC panel proportions (from schematic grid column widths) ────────────
// Forward: cols 23-38 = 16 cols, Reactor: 17-20 = 4 cols, Engineering: 4-14 = 11 cols
// Total pressure hull: ~31 cols
export const COMP_FRACS = [0.52, 0.13, 0.35];
export const COMP_LABELS = ['WTS 1', 'WTS 2', 'WTS 3'];

// ── Watertight Door definitions ─────────────────────────────────────────
export const WTD_PAIRS = [
  ['forward', 'reactor'],
  ['reactor', 'engineering'],
];
export const WTD_RC_KEYS = new Set(['forward|reactor', 'reactor|engineering']);

// ── Travel time table (seconds) ─────────────────────────────────────────
export const TRAVEL = {
  forward:     { forward:0,  reactor:15, engineering:35 },
  reactor:     { forward:15, reactor:0,  engineering:15 },
  engineering: { forward:35, reactor:15, engineering:0  },
};

// ── Adjacent compartments for crew evacuation ───────────────────────────
export const EVAC_TO = {
  forward:     ['reactor'],
  reactor:     ['forward', 'engineering'],
  engineering: ['reactor'],
};

export const SECTION_CAP = 54;

// ── Watchspace (Room) definitions ───────────────────────────────────────
// Schematic grid: cols 1-46, rows a-k. Forward=bow (right), Aft=stern (left).
// col: 0=bow (col 35-38 in schematic), 3=aft (col 23-26). Reversed for rendering (bow=left).
// colSpan: number of 4-column compartment widths the room occupies.
export const ROOMS = {
  // ── WTS 1 — Forward Compartment ──────────────────────────────────────
  // Upper deck (d-e) — bow to aft: Wardroom, Computer Room, Ctrl/Sonar, Comms
  fwd_wardroom:    { label:'WARDROOM',           section:'forward', deck:0, col:0, colSpan:1, crew:3,  detectionDelay:0  },
  fwd_computer:    { label:'COMPUTER ROOM',      section:'forward', deck:0, col:1, colSpan:1, crew:2,  detectionDelay:0  },
  fwd_ctrlsonar:   { label:'CONTROL / SONAR',    section:'forward', deck:0, col:2, colSpan:2, crew:10, detectionDelay:0  },
  fwd_comms:       { label:'COMMS',              section:'forward', deck:0, col:3, colSpan:1, crew:3,  detectionDelay:0  },
  // Note: Wardroom spans 2 decks (upper + mid)
  // Mid deck (f-g)
  fwd_wardroom_lo: { label:'WARDROOM (LOWER)',   section:'forward', deck:1, col:0, colSpan:1, crew:0,  detectionDelay:20 },
  fwd_mess_sm:     { label:'CREW MESS',          section:'forward', deck:1, col:1, colSpan:2, crew:6,  detectionDelay:0  },
  fwd_mess_lg:     { label:'CREW MESS',          section:'forward', deck:1, col:3, colSpan:1, crew:4,  detectionDelay:0  },
  // Lower deck (h-i)
  fwd_torpedo:     { label:'TORPEDO ROOM',       section:'forward', deck:2, col:0, colSpan:2, crew:6,  detectionDelay:0  },
  fwd_diesel:      { label:'DIESEL ENGINE ROOM', section:'forward', deck:2, col:2, colSpan:1, crew:0,  detectionDelay:40 },
  fwd_aux:         { label:'AUX MACHINERY',      section:'forward', deck:2, col:3, colSpan:1, crew:0,  detectionDelay:50 },
  // Sub-deck (j) — battery spans full section
  fwd_battery:     { label:'BATTERY',            section:'forward', deck:3, col:0, colSpan:4, crew:0,  detectionDelay:60 },

  // ── WTS 2 — Reactor Compartment ──────────────────────────────────────
  rx_tunnel:       { label:'RC TUNNEL',          section:'reactor', deck:0, col:0, colSpan:1, crew:0,  detectionDelay:30, noEvac:true },
  rx_reactor:      { label:'REACTOR',            section:'reactor', deck:1, col:0, colSpan:1, crew:3,  detectionDelay:0,  noEvac:true },

  // ── WTS 3 — Engineering ──────────────────────────────────────────────
  eng_main:        { label:'ENGINEERING',        section:'engineering', deck:0, col:1, colSpan:2, crew:4,  detectionDelay:0  },
  eng_maneuvering: { label:'MANEUVERING',        section:'engineering', deck:0, col:0, colSpan:1, crew:6,  detectionDelay:0  },
  eng_elec:        { label:'ELEC DISTRIBUTION',  section:'engineering', deck:1, col:0, colSpan:1, crew:2,  detectionDelay:0  },
  eng_machinery:   { label:'MACHINERY',          section:'engineering', deck:2, col:0, colSpan:1, crew:0,  detectionDelay:45 },
};

// ── System definitions ──────────────────────────────────────────────────
export const SYS_DEF = {
  // ── WTS 1 — Forward Compartment ─────────────────────────────────────
  tubes:          { label:'TORPEDO TUBES',     room:'fwd_torpedo',    ctrl:'fire_ctrl' },
  sonar_hull:     { label:'SONAR ARRAY',       room:'fwd_ctrlsonar'  },
  tma:            { label:'TMA',               room:'fwd_computer'   },
  tdc_comp:       { label:'TDC COMPUTER',      room:'fwd_computer',  ctrl:'fire_ctrl' },
  fire_ctrl:      { label:'FIRE CONTROL',      room:'fwd_ctrlsonar'  },
  helm:           { label:'HELM',              room:'fwd_ctrlsonar'  },
  ballast:        { label:'BALLAST CTRL',      room:'fwd_ctrlsonar'  },
  nav_sys:        { label:'NAVIGATION',        room:'fwd_ctrlsonar'  },
  periscope:      { label:'PERISCOPE',         room:'fwd_ctrlsonar'  },
  comms_mast:     { label:'COMMS MAST',        room:'fwd_comms'      },
  co2_scrubbers:  { label:'CO2 SCRUBBERS',     room:'fwd_aux'        },
  o2_gen:         { label:'O2 GENERATOR',      room:'fwd_aux'        },
  aux_power:      { label:'AUX POWER PANEL',   room:'fwd_aux'        },
  emerg_diesel:   { label:'EMERGENCY DIESEL',  room:'fwd_diesel'     },
  battery_bank:   { label:'BATTERY BANK',      room:'fwd_battery'    },
  weapon_stow:    { label:'WEAPON STOWAGE',    room:'fwd_torpedo'    },
  hyd_main:       { label:'MAIN HYD PLANT',    room:'fwd_aux'        },
  planes_fwd_hyd: { label:'FWD PLANES HYD',    room:'fwd_ctrlsonar', ctrl:'helm' },
  fwd_trim:       { label:'FWD TRIM TANK',     room:'fwd_torpedo'    },
  fwd_escape:     { label:'FWD ESCAPE TRUNK',  room:'fwd_torpedo'    },
  vent_plant:     { label:'VENT PLANT',        room:'fwd_aux'        },

  // ── Watertight Doors ────────────────────────────────────────────────
  wtd_fwd_rx:     { label:'WTD 1 (FWD/RX)',   room:'fwd_comms',     isWTD:true, wtdKey:'forward|reactor' },
  wtd_rx_eng:     { label:'WTD 2 (RX/ENG)',   room:'eng_maneuvering', isWTD:true, wtdKey:'reactor|engineering' },

  // ── WTS 2 — Reactor Compartment ─────────────────────────────────────
  reactor:        { label:'REACTOR',           room:'rx_reactor',    nuclearOnly:true },
  primary_coolant:{ label:'PRIMARY COOLANT',   room:'rx_reactor',    nuclearOnly:true },
  pressuriser:    { label:'PRESSURISER',       room:'rx_reactor',    nuclearOnly:true },
  rad_monitor:    { label:'RAD MONITORING',    room:'rx_tunnel',     nuclearOnly:true },

  // ── WTS 3 — Engineering ─────────────────────────────────────────────
  condenser:      { label:'CONDENSER',         room:'eng_main',      nuclearOnly:true },
  propulsion:     { label:'PROPULSION',        room:'eng_main'       },
  main_turbines:  { label:'MAIN TURBINES',     room:'eng_machinery', nuclearOnly:true },
  elec_dist:      { label:'ELEC DISTRIBUTION', room:'eng_elec'       },
  steering:       { label:'STEERING',          room:'eng_machinery'  },
  planes_aft_hyd: { label:'AFT PLANES HYD',    room:'eng_machinery'  },
  shaft_seals:    { label:'SHAFT SEALS',       room:'eng_machinery'  },
  towed_array:    { label:'TOWED ARRAY',       room:'eng_machinery'  },
  aft_trim:       { label:'AFT TRIM TANK',     room:'eng_machinery'  },
  aft_escape:     { label:'AFT ESCAPE TRUNK',  room:'eng_main'       },
};

// ── External equipment (outside pressure hull) ─────────────────────────
export const EXTERNALS = {
  bow_array:  { label:'BOW ARRAY',   position:'bow' },
  propshaft:  { label:'PROPSHAFT',   position:'stern' },
};

export const HIGH_ENERGY_SYS = new Set(['reactor','propulsion','primary_coolant','main_turbines']);
export const PASSIVE_SYS = new Set(['fwd_escape','aft_escape','fwd_trim','aft_trim','shaft_seals','rad_monitor']);
export const DECK_HEIGHTS = [1, 1, 1, 0.4]; // battery is a thin strip
export const TRIM_LEVERS = { forward:-1.0, reactor:0.0, engineering:1.5 };
