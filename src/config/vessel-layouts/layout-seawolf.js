'use strict';

// ── Seawolf Class — 3 Watertight Sections, 4 Decks ─────────────────────
// Source: Jason's schematic, confirmed 2026-03-21
// Largest and most capable submarine. 8 torpedo tubes, 50-weapon magazine.
// 4 decks (vs 3 for 688/Trafalgar). Larger reactor section with 4 watchspaces.

export const COMPS = ['forward', 'reactor', 'engineering'];

export const COMP_DEF = {
  forward:     { label:'FORWARD COMPARTMENT', crewCount:100, volume:22, tower:'fwd', unmanned:false },
  reactor:     { label:'REACTOR COMP',        crewCount:6,   volume:8,  tower:null,  unmanned:false },
  engineering: { label:'ENGINEERING',         crewCount:30,  volume:14, tower:'aft', unmanned:false },
};

export const SECTION_LABEL = {
  forward:     'WATERTIGHT SECTION 1',
  reactor:     'WATERTIGHT SECTION 2',
  engineering: 'WATERTIGHT SECTION 3',
};

export const SECTION_SHORT = {
  forward:'WTS1', reactor:'WTS2', engineering:'WTS3',
};

// Forward: cols 27-42 = 16 cols, Reactor: 17-24 = 8 cols, Engineering: 4-14 = 11 cols
// Total: ~35 cols
export const COMP_FRACS = [0.50, 0.15, 0.35];
export const COMP_LABELS = ['WTS 1', 'WTS 2', 'WTS 3'];

export const WTD_PAIRS = [
  ['forward', 'reactor'],
  ['reactor', 'engineering'],
];
export const WTD_RC_KEYS = new Set(['forward|reactor', 'reactor|engineering']);

export const TRAVEL = {
  forward:     { forward:0,  reactor:18, engineering:40 },
  reactor:     { forward:18, reactor:0,  engineering:18 },
  engineering: { forward:40, reactor:18, engineering:0  },
};

export const EVAC_TO = {
  forward:     ['reactor'],
  reactor:     ['forward', 'engineering'],
  engineering: ['reactor'],
};

export const SECTION_CAP = 60;

// ── Watchspace (Room) definitions ───────────────────────────────────────
// 4 decks: D0=upper, D1=second, D2=third, D3=lower.
// col: 0=bow, 3=aft (reversed for rendering: bow=left).
export const ROOMS = {
  // ── WTS 1 — Forward Compartment (4 wide × 4 decks + battery) ─────────
  // D0 (d-e)
  fwd_comms:       { label:'COMMS',              section:'forward', deck:0, col:0, colSpan:1, crew:3,  detectionDelay:0  },
  fwd_sonar:       { label:'SONAR ROOM',         section:'forward', deck:0, col:1, colSpan:1, crew:6,  detectionDelay:0  },
  fwd_control:     { label:'CONTROL ROOM',       section:'forward', deck:0, col:2, colSpan:1, crew:10, detectionDelay:0  },
  fwd_wardroom:    { label:'WARDROOM',           section:'forward', deck:0, col:3, colSpan:1, crew:3,  detectionDelay:0  },
  // D1 (f-g)
  fwd_computer:    { label:'COMPUTER ROOM',      section:'forward', deck:1, col:0, colSpan:1, crew:2,  detectionDelay:0  },
  fwd_mess_lg:     { label:'CREW MESS',          section:'forward', deck:1, col:1, colSpan:2, crew:8,  detectionDelay:0  },
  fwd_mess_sm:     { label:'CREW MESS',          section:'forward', deck:1, col:3, colSpan:1, crew:4,  detectionDelay:0  },
  // D2 (h-i)
  fwd_torpedo:     { label:'TORPEDO ROOM',       section:'forward', deck:2, col:0, colSpan:3, crew:8,  detectionDelay:0  },
  fwd_aux:         { label:'AUX MACHINERY',      section:'forward', deck:2, col:3, colSpan:1, crew:0,  detectionDelay:50 },
  // D3 (j-k) — torpedo room continues from D2
  fwd_diesel:      { label:'DIESEL ENGINE ROOM', section:'forward', deck:3, col:3, colSpan:1, crew:0,  detectionDelay:40 },
  // Battery (sub-deck l)
  fwd_battery:     { label:'BATTERY',            section:'forward', deck:4, col:0, colSpan:4, crew:0,  detectionDelay:60 },

  // ── WTS 2 — Reactor Compartment (2 wide × 4 decks) ───────────────────
  rx_computer:     { label:'RC COMPUTER CTRL',   section:'reactor', deck:0, col:1, colSpan:1, crew:2,  detectionDelay:0, noEvac:true },
  rx_tunnel:       { label:'RC TUNNEL',          section:'reactor', deck:0, col:0, colSpan:1, crew:0,  detectionDelay:30, noEvac:true },
  rx_support:      { label:'REACTOR SUPPORT',    section:'reactor', deck:1, col:1, colSpan:1, crew:2,  detectionDelay:0, noEvac:true },
  rx_reactor:      { label:'REACTOR',            section:'reactor', deck:1, col:0, colSpan:1, crew:3,  detectionDelay:0, noEvac:true },

  // ── WTS 3 — Engineering (3 wide × 4 decks) ───────────────────────────
  eng_main:        { label:'ENGINEERING',        section:'engineering', deck:0, col:1, colSpan:2, crew:4,  detectionDelay:0  },
  eng_maneuvering: { label:'MANEUVERING',        section:'engineering', deck:0, col:0, colSpan:1, crew:8,  detectionDelay:0  },
  eng_elec:        { label:'ELEC DISTRIBUTION',  section:'engineering', deck:1, col:0, colSpan:1, crew:2,  detectionDelay:0  },
  eng_condenser:   { label:'CONDENSER',          section:'engineering', deck:2, col:0, colSpan:1, crew:0,  detectionDelay:45 },
  eng_machinery:   { label:'MACHINERY',          section:'engineering', deck:3, col:0, colSpan:1, crew:0,  detectionDelay:45 },
};

// ── System definitions ──────────────────────────────────────────────────
export const SYS_DEF = {
  // ── WTS 1 — Forward ─────────────────────────────────────────────────
  tubes:          { label:'TORPEDO TUBES',     room:'fwd_torpedo',    ctrl:'fire_ctrl' },
  sonar_hull:     { label:'SONAR ARRAY',       room:'fwd_sonar'      },
  tma:            { label:'TMA',               room:'fwd_computer'   },
  tdc_comp:       { label:'TDC COMPUTER',      room:'fwd_computer',  ctrl:'fire_ctrl' },
  fire_ctrl:      { label:'FIRE CONTROL',      room:'fwd_control'    },
  helm:           { label:'HELM',              room:'fwd_control'    },
  ballast:        { label:'BALLAST CTRL',      room:'fwd_control'    },
  nav_sys:        { label:'NAVIGATION',        room:'fwd_control'    },
  periscope:      { label:'PERISCOPE',         room:'fwd_control'    },
  comms_mast:     { label:'COMMS MAST',        room:'fwd_comms'      },
  co2_scrubbers:  { label:'CO2 SCRUBBERS',     room:'fwd_aux'        },
  o2_gen:         { label:'O2 GENERATOR',      room:'fwd_aux'        },
  aux_power:      { label:'AUX POWER PANEL',   room:'fwd_aux'        },
  emerg_diesel:   { label:'EMERGENCY DIESEL',  room:'fwd_diesel'     },
  battery_bank:   { label:'BATTERY BANK',      room:'fwd_battery'    },
  weapon_stow:    { label:'WEAPON STOWAGE',    room:'fwd_torpedo'    },
  hyd_main:       { label:'MAIN HYD PLANT',    room:'fwd_aux'        },
  planes_fwd_hyd: { label:'FWD PLANES HYD',    room:'fwd_control',   ctrl:'helm' },
  fwd_trim:       { label:'FWD TRIM TANK',     room:'fwd_torpedo'    },
  fwd_escape:     { label:'FWD ESCAPE TRUNK',  room:'fwd_torpedo'    },
  vent_plant:     { label:'VENT PLANT',        room:'fwd_aux'        },

  // ── Watertight Doors ────────────────────────────────────────────────
  wtd_fwd_rx:     { label:'WTD 1 (FWD/RX)',   room:'fwd_comms',     isWTD:true, wtdKey:'forward|reactor' },
  wtd_rx_eng:     { label:'WTD 2 (RX/ENG)',   room:'eng_maneuvering', isWTD:true, wtdKey:'reactor|engineering' },

  // ── WTS 2 — Reactor ─────────────────────────────────────────────────
  reactor:        { label:'REACTOR',           room:'rx_reactor',    nuclearOnly:true },
  primary_coolant:{ label:'PRIMARY COOLANT',   room:'rx_reactor',    nuclearOnly:true },
  pressuriser:    { label:'PRESSURISER',       room:'rx_reactor',    nuclearOnly:true },
  rad_monitor:    { label:'RAD MONITORING',    room:'rx_tunnel',     nuclearOnly:true },
  rx_ctrl_sys:    { label:'REACTOR CONTROL',   room:'rx_computer',   nuclearOnly:true },
  rx_support_sys: { label:'REACTOR SUPPORT',   room:'rx_support',    nuclearOnly:true },

  // ── WTS 3 — Engineering ─────────────────────────────────────────────
  propulsion:     { label:'PROPULSION',        room:'eng_main'       },
  main_turbines:  { label:'MAIN TURBINES',     room:'eng_machinery', nuclearOnly:true },
  elec_dist:      { label:'ELEC DISTRIBUTION', room:'eng_elec'       },
  condenser:      { label:'CONDENSER',         room:'eng_condenser', nuclearOnly:true },
  steering:       { label:'STEERING',          room:'eng_machinery'  },
  planes_aft_hyd: { label:'AFT PLANES HYD',    room:'eng_machinery'  },
  shaft_seals:    { label:'SHAFT SEALS',       room:'eng_machinery'  },
  towed_array:    { label:'TOWED ARRAY',       room:'eng_machinery'  },
  aft_trim:       { label:'AFT TRIM TANK',     room:'eng_machinery'  },
  aft_escape:     { label:'AFT ESCAPE TRUNK',  room:'eng_main'       },
};

export const EXTERNALS = {
  bow_array:  { label:'BOW ARRAY',   position:'bow' },
  propshaft:  { label:'PROPSHAFT',   position:'stern' },
};

export const HIGH_ENERGY_SYS = new Set(['reactor','propulsion','primary_coolant','main_turbines','condenser']);
export const PASSIVE_SYS = new Set(['fwd_escape','aft_escape','fwd_trim','aft_trim','shaft_seals','rad_monitor']);
export const DECK_HEIGHTS = [1, 1, 1, 1, 0.4]; // 4 main decks + battery sub-deck
export const TRIM_LEVERS = { forward:-1.0, reactor:0.0, engineering:1.5 };
