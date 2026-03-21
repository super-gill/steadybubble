'use strict';

// ── Legacy 6-WTS Layout ────────────────────────────────────────────────
// Compatibility shim: preserves the original 6-WTS layout for vessels that
// have not yet received their real schematic-based layouts.
// Used by: trafalgar, swiftsure, seawolf, type209
// This file will be removed once all vessels have real layouts.

import { CONFIG } from '../constants.js';

export const COMPS = ['fore_ends','control_room','aux_section','reactor_comp','engine_room','aft_ends'];

export const COMP_DEF = {
  fore_ends:    { label:'TORPEDO ROOM',  crewCount:23, volume:4, tower:'fwd',  unmanned:false },
  control_room: { label:'CONTROL ROOM',  crewCount:20, volume:4, tower:'fwd',  unmanned:false },
  aux_section:  { label:'MESS DECKS',    crewCount:7,  volume:4, tower:null,   unmanned:false },
  reactor_comp: { label:'REACTOR COMP',  crewCount:3,  volume:3, tower:null,   unmanned:false },
  engine_room:  { label:'MANEUVERING',   crewCount:20, volume:4, tower:'aft',  unmanned:false },
  aft_ends:     { label:'ENGINEERING',   crewCount:15, volume:4, tower:'aft',  unmanned:false },
};

export const SECTION_LABEL = {
  fore_ends:    'WATERTIGHT SECTION 1',
  control_room: 'WATERTIGHT SECTION 2',
  aux_section:  'WATERTIGHT SECTION 3',
  reactor_comp: 'WATERTIGHT SECTION 4',
  engine_room:  'WATERTIGHT SECTION 5',
  aft_ends:     'WATERTIGHT SECTION 6',
};

export const SECTION_SHORT = {
  fore_ends:'WTS1', control_room:'WTS2', aux_section:'WTS3',
  reactor_comp:'WTS4', engine_room:'WTS5', aft_ends:'WTS6',
};

export const COMP_FRACS = [0.21, 0.21, 0.08, 0.10, 0.21, 0.19];
export const COMP_LABELS = ['WTS 1','WTS 2','WTS 3','WTS 4','WTS 5','WTS 6'];

export const WTD_PAIRS = [
  ['fore_ends','control_room'],
  ['control_room','aux_section'],
  ['aux_section','reactor_comp'],
  ['reactor_comp','engine_room'],
  ['engine_room','aft_ends'],
];
export const WTD_RC_KEYS = new Set(['aux_section|reactor_comp','reactor_comp|engine_room']);

export const TRAVEL = {
  fore_ends:    { fore_ends:0,  control_room:10, aux_section:18, reactor_comp:28, engine_room:46, aft_ends:56 },
  control_room: { fore_ends:10, control_room:0,  aux_section:8,  reactor_comp:18, engine_room:36, aft_ends:46 },
  aux_section:  { fore_ends:18, control_room:8,  aux_section:0,  reactor_comp:10, engine_room:28, aft_ends:38 },
  reactor_comp: { fore_ends:28, control_room:18, aux_section:10, reactor_comp:0,  engine_room:18, aft_ends:28 },
  engine_room:  { fore_ends:46, control_room:36, aux_section:28, reactor_comp:18, engine_room:0,  aft_ends:10 },
  aft_ends:     { fore_ends:56, control_room:46, aux_section:38, reactor_comp:28, engine_room:10, aft_ends:0  },
};

export const EVAC_TO = {
  fore_ends:    ['control_room'],
  control_room: ['aux_section','fore_ends'],
  aux_section:  ['control_room','reactor_comp'],
  reactor_comp: ['aux_section','engine_room'],
  engine_room:  ['reactor_comp','aft_ends'],
  aft_ends:     ['engine_room'],
};

export const SECTION_CAP = 54;

export const ROOMS = {
  fore_ends_d0:    { label:'FWD DOME',       section:'fore_ends',    deck:0, crew:0, detectionDelay:40 },
  fore_ends_d0b:   { label:'COMMS',          section:'fore_ends',    deck:0, crew:3, detectionDelay:0  },
  fore_ends_d1:    { label:'ENG OFFICE',     section:'fore_ends',    deck:1, crew:1, detectionDelay:20 },
  fore_ends_d1b:   { label:'COMPUTER RM',    section:'fore_ends',    deck:1, crew:0, detectionDelay:35 },
  fore_ends_d2:    { label:'TORPEDO ROOM',   section:'fore_ends',    deck:2, crew:4, detectionDelay:0  },
  control_room_d0:  { label:'NAV',           section:'control_room', deck:0, crew:1, detectionDelay:0  },
  control_room_d0b: { label:'SCOPE WELL',    section:'control_room', deck:0, crew:2, detectionDelay:0  },
  control_room_d0c: { label:'WARDROOM',      section:'control_room', deck:0, crew:3, detectionDelay:0  },
  control_room_d1:  { label:'CONTROL ROOM',  section:'control_room', deck:1, crew:6, detectionDelay:0  },
  control_room_d1b: { label:'CO CABIN',      section:'control_room', deck:1, crew:0, detectionDelay:30 },
  control_room_d2:  { label:'MACHINERY SPACE',section:'control_room',deck:2, crew:0, detectionDelay:40 },
  aux_section_d0:   { label:'JR MESS',       section:'aux_section',  deck:0, crew:6, detectionDelay:0  },
  aux_section_d0b:  { label:'SR MESS',       section:'aux_section',  deck:0, crew:4, detectionDelay:0  },
  aux_section_d1:   { label:'BUNKS',         section:'aux_section',  deck:1, crew:2, detectionDelay:20 },
  aux_section_d1b:  { label:'VENT PLANT',    section:'aux_section',  deck:1, crew:0, detectionDelay:45 },
  aux_section_d2:   { label:'AMS 1',         section:'aux_section',  deck:2, crew:0, detectionDelay:50 },
  aux_section_d2b:  { label:'RX E-COOL',     section:'aux_section',  deck:2, crew:0, detectionDelay:50 },
  aux_section_d2c:  { label:'SICKBAY',       section:'aux_section',  deck:2, crew:1, detectionDelay:0  },
  reactor_comp_d0: { label:'RC TUNNEL',      section:'reactor_comp', deck:0, crew:0, detectionDelay:30, noEvac:true },
  reactor_comp_d1: { label:'REACTOR',        section:'reactor_comp', deck:1, crew:3, detectionDelay:0,  noEvac:true },
  reactor_comp_d2: { label:'REACTOR (LOWER)',section:'reactor_comp', deck:2, crew:0, detectionDelay:60, noEvac:true },
  engine_room_d0:   { label:'AFT PASSAGE',   section:'engine_room',  deck:0, crew:0, detectionDelay:0  },
  engine_room_d0b:  { label:'MANEUVERING',   section:'engine_room',  deck:0, crew:4, detectionDelay:0  },
  engine_room_d1:   { label:'ELEC DIST',     section:'engine_room',  deck:1, crew:2, detectionDelay:0  },
  engine_room_d2:   { label:'AFT ATMOS',     section:'engine_room',  deck:2, crew:0, detectionDelay:45 },
  aft_ends_d0:      { label:'ENGINEERING',   section:'aft_ends',     deck:0, crew:2, detectionDelay:0  },
  aft_ends_d1:      { label:'PROPULSION',    section:'aft_ends',     deck:1, crew:2, detectionDelay:0  },
  aft_ends_d1b:     { label:'SHAFT ALLEY',   section:'aft_ends',     deck:1, crew:1, detectionDelay:0  },
  aft_ends_d2:      { label:'STEERING GEAR', section:'aft_ends',     deck:2, crew:2, detectionDelay:0  },
  aft_ends_d2b:     { label:'AFT ESCAPE',    section:'aft_ends',     deck:0, crew:0, detectionDelay:50 },
};

export const SYS_DEF = {
  // Watertight Doors (boundary systems)
  wtd_fe_cr:      { label:'WTD 1 (TORP/CTRL)', room:'fore_ends_d2',     isWTD:true, wtdKey:'fore_ends|control_room' },
  wtd_cr_ax:      { label:'WTD 2 (CTRL/AUX)',  room:'control_room_d2',  isWTD:true, wtdKey:'control_room|aux_section' },
  wtd_ax_rx:      { label:'WTD 3 (AUX/RX)',    room:'aux_section_d2',   isWTD:true, wtdKey:'aux_section|reactor_comp' },
  wtd_rx_er:      { label:'WTD 4 (RX/ENG)',    room:'reactor_comp_d1',  isWTD:true, wtdKey:'reactor_comp|engine_room' },
  wtd_er_ae:      { label:'WTD 5 (ENG/AFT)',   room:'engine_room_d0',   isWTD:true, wtdKey:'engine_room|aft_ends' },
  tubes:          { label:'TORPEDO TUBES',     room:'fore_ends_d2',     ctrl:'fire_ctrl' },
  sonar_hull:     { label:'SONAR ARRAY',       room:'fore_ends_d2'     },
  planes_fwd_hyd: { label:'FWD PLANES HYD',    room:'fore_ends_d1',     ctrl:'helm' },
  weapon_stow:    { label:'WEAPON STOWAGE',    room:'fore_ends_d2'     },
  fwd_trim:       { label:'FWD TRIM TANK',     room:'fore_ends_d2'     },
  fwd_escape:     { label:'FWD ESCAPE TRUNK',  room:'fore_ends_d0'     },
  tma:            { label:'TMA',               room:'fore_ends_d1b'    },
  tdc_comp:       { label:'TDC COMPUTER',      room:'fore_ends_d1b',    ctrl:'fire_ctrl' },
  periscope:      { label:'PERISCOPE',         room:'control_room_d0'  },
  ballast:        { label:'BALLAST CTRL',      room:'control_room_d1'  },
  hyd_main:       { label:'MAIN HYD PLANT',    room:'control_room_d2'  },
  helm:           { label:'HELM',              room:'control_room_d1'  },
  fire_ctrl:      { label:'FIRE CONTROL',      room:'control_room_d1'  },
  nav_sys:        { label:'NAVIGATION',        room:'control_room_d0'  },
  comms_mast:     { label:'COMMS MAST',        room:'control_room_d0'  },
  co2_scrubbers:  { label:'CO2 SCRUBBERS',     room:'aux_section_d1'   },
  o2_gen:         { label:'O2 GENERATOR',      room:'aux_section_d2'   },
  aux_power:      { label:'AUX POWER PANEL',   room:'aux_section_d0'   },
  vent_plant:     { label:'VENT PLANT',        room:'aux_section_d1b'  },
  reactor:        { label:'REACTOR',           room:'reactor_comp_d1',  nuclearOnly:true },
  primary_coolant:{ label:'PRIMARY COOLANT',   room:'reactor_comp_d2',  nuclearOnly:true },
  pressuriser:    { label:'PRESSURISER',       room:'reactor_comp_d1',  nuclearOnly:true },
  rad_monitor:    { label:'RAD MONITORING',    room:'reactor_comp_d0',  nuclearOnly:true },
  diesel_engine:  { label:'DIESEL ENGINE',     room:'reactor_comp_d1',  dieselOnly:true  },
  alternator:     { label:'ALTERNATOR',        room:'reactor_comp_d2',  dieselOnly:true  },
  propulsion:     { label:'PROPULSION',        room:'engine_room_d0b'  },
  main_turbines:  { label:'MAIN TURBINES',     room:'engine_room_d2',   nuclearOnly:true },
  elec_dist:      { label:'ELEC DISTRIBUTION', room:'engine_room_d1'   },
  emerg_diesel:   { label:'EMERGENCY DIESEL',  room:'engine_room_d2',   nuclearOnly:true },
  battery_bank:   { label:'BATTERY BANK',      room:'engine_room_d1'   },
  main_motor:     { label:'MAIN MOTOR',        room:'engine_room_d0b',  dieselOnly:true  },
  towed_array:    { label:'TOWED ARRAY',       room:'aft_ends_d2'      },
  steering:       { label:'STEERING',          room:'aft_ends_d2'      },
  planes_aft_hyd: { label:'AFT PLANES HYD',    room:'aft_ends_d1'      },
  shaft_seals:    { label:'SHAFT SEALS',       room:'aft_ends_d1b'     },
  aft_trim:       { label:'AFT TRIM TANK',     room:'aft_ends_d2'      },
  aft_escape:     { label:'AFT ESCAPE TRUNK',  room:'aft_ends_d2b'     },
};

export const EXTERNALS = {
  bow_array:  { label:'BOW ARRAY',   position:'bow' },
  propshaft:  { label:'PROPSHAFT',   position:'stern' },
};

export const HIGH_ENERGY_SYS = new Set(['reactor','propulsion','primary_coolant','main_turbines']);
export const PASSIVE_SYS = new Set(['fwd_escape','aft_escape','fwd_trim','aft_trim','shaft_seals','rad_monitor']);
export const TRIM_LEVERS = { fore_ends:-2.0, control_room:-0.8, aux_section:-0.2, reactor_comp:0.0, engine_room:0.8, aft_ends:2.0 };
