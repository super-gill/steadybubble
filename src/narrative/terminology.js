'use strict';

import { CONFIG } from '../config/constants.js';

// ── Nation-specific terminology ──────────────────────────────────────────────
// Returns the correct term for the current vessel's nation.
// All strings are English — DE uses German-flavoured English (clipped, direct).

const TERMS = {
  // ── Watch officer title (displayed in messages and watch handover) ────────
  oow:          { US:'OOD',             UK:'OOW',             DE:'WO'              },
  oowFull:      { US:'Officer of the Deck', UK:'Officer of the Watch', DE:'Watch Officer' },
  co:           { US:'CO',              UK:'CO',              DE:'KDT'             },
  xo:           { US:'XO',              UK:'XO',              DE:'IWO'             },

  // ── Station labels used in log categories ─────────────────────────────────
  // These map to the short labels that appear as category pills in the message log.
  // Most stay the same; DE uses slightly different labels.
  stConn:       { US:'CONN',            UK:'CONN',            DE:'CTRL'            },
  stSonar:      { US:'SONAR',           UK:'SONAR',           DE:'SONAR'           },
  stHelm:       { US:'HELM',            UK:'HELM',            DE:'HELM'            },
  stEng:        { US:'ENG',             UK:'ENG',             DE:'MACH'            },
  stWeps:       { US:'WEPS',            UK:'WEPS',            DE:'TORP'            },
  stManv:       { US:'MANV',            UK:'MANV',            DE:'MACH'            },
  stComms:      { US:'COMMS',           UK:'COMMS',           DE:'RADIO'           },
  stNav:        { US:'NAV',             UK:'NAV',             DE:'NAV'             },
  stMeds:       { US:'MEDS',            UK:'MEDS',            DE:'MEDS'            },
  stDC:         { US:'DC',              UK:'DC',              DE:'DC'              },
  stCO:         { US:'CO',              UK:'CO',              DE:'KDT'             },
  stTor:        { US:'TOR',             UK:'TOR',             DE:'TORP'            },

  // ── Addressing: who speaks to whom ────────────────────────────────────────
  connSonar:    { US:'Conn, Sonar',     UK:'Conn, Sonar',     DE:'Control, Sonar'  },
  sonarConn:    { US:'Sonar, Conn',     UK:'Sonar, Conn',     DE:'Sonar, Control'  },
  connHelm:     { US:'Helm, Conn',      UK:'Helm, Conn',      DE:'Rudder, Control' },
  helmConn:     { US:'Conn, Helm',      UK:'Conn, Helm',      DE:'Control, Rudder' },
  connEng:      { US:'Eng, Conn',       UK:'Eng, Conn',       DE:'Machine, Control'},
  engConn:      { US:'Conn, Eng',       UK:'Conn, Eng',       DE:'Control, Machine'},
  connWeps:     { US:'Weps, Conn',      UK:'Weps, Conn',      DE:'Torpedo, Control'},
  wepsConn:     { US:'Conn, Weps',      UK:'Conn, Weps',      DE:'Control, Torpedo'},
  connManv:     { US:'Conn, Manoeuvring', UK:'Conn, Manoeuvring', DE:'Control, Machine Room' },
  manvConn:     { US:'Manoeuvring, Conn',  UK:'Manoeuvring, Conn',  DE:'Machine Room, Control'  },
  connAll:      { US:'Conn — all stations', UK:'Conn — all stations', DE:'Control — all stations' },
  allConn:      { US:'All stations, Conn',  UK:'All stations, Conn',  DE:'All stations, Control'  },

  // ── Key command phrases ───────────────────────────────────────────────────
  torpedoAway:      { US:'TORPEDO AWAY',      UK:'TORPEDO GONE',      DE:'TORPEDO RUNNING'     },
  missileAway:      { US:'MISSILE AWAY',      UK:'MISSILE AWAY',      DE:'MISSILE LAUNCHED'    },
  actionStations:   { US:'Battle stations',   UK:'Action stations',   DE:'Combat stations'     },
  actionStationsU:  { US:'BATTLE STATIONS',   UK:'ACTION STATIONS',   DE:'COMBAT STATIONS'     },
  emergencyBlow:    { US:'EMERGENCY BLOW',    UK:'EMERGENCY BLOW',    DE:'BLOW ALL TANKS'      },
  emergencyBlowCmd: { US:'Blow all main ballast. Emergency surface',
                      UK:'Blow all main ballast. Emergency surface',
                      DE:'Blow all tanks. Emergency surface'          },
  crashDive:        { US:'CRASH DIVE',        UK:'CRASH DIVE',        DE:'CRASH DIVE'          },
  emergencyStations:{ US:'EMERGENCY STATIONS', UK:'EMERGENCY STATIONS', DE:'EMERGENCY STATIONS' },
  escapeStations:   { US:'ESCAPE STATIONS',   UK:'ESCAPE STATIONS',   DE:'ABANDON STATIONS'    },
  silentRunning:    { US:'rig for ultra-quiet', UK:'rig for silent running', DE:'rig for silent routine' },
  silentRunningU:   { US:'ULTRA-QUIET',       UK:'SILENT RUNNING',    DE:'SILENT ROUTINE'      },
  normalRun:        { US:'NORMAL OPS',        UK:'NORMAL RUN',        DE:'NORMAL ROUTINE'      },
  standDown:        { US:'stand down',        UK:'stand down',        DE:'secure from'         },

  // ── Compartment naming in reports ─────────────────────────────────────────
  controlRoom:      { US:'control room',      UK:'control room',      DE:'control room'        },
  maneuvering:      { US:'maneuvering',       UK:'manoeuvring',       DE:'machine room'        },
  torpedoRoom:      { US:'torpedo room',      UK:'torpedo room',      DE:'torpedo room'        },

  // ── Report style: acknowledgement ─────────────────────────────────────────
  aye:              { US:'aye',               UK:'aye',               DE:'acknowledged'        },
  ayeSir:           { US:'aye sir',           UK:'aye sir',           DE:'acknowledged'        },

  // ── Crew state commands (3× repeat patterns) ─────────────────────────────
  // USN: "Battle stations, battle stations, battle stations"
  // RN:  "Action stations, action stations, action stations"
  // DE:  "Combat stations, combat stations, combat stations"
  actionStations3x: {
    US:'Battle stations, battle stations, battle stations',
    UK:'Action stations, action stations, action stations',
    DE:'Combat stations, combat stations, combat stations',
  },
  emergencyStations3x: {
    US:'Emergency stations, emergency stations, emergency stations',
    UK:'Emergency stations, emergency stations, emergency stations',
    DE:'Emergency stations, emergency stations, emergency stations',
  },
  escapeStations3x: {
    US:'Escape stations, escape stations, escape stations',
    UK:'Escape stations, escape stations, escape stations',
    DE:'Abandon stations, abandon stations, abandon stations',
  },

  // ── Reactor / propulsion (DE has no reactor) ──────────────────────────────
  reactorScram:     { US:'REACTOR SCRAM',     UK:'REACTOR SCRAM',     DE:null                  },
  epm:              { US:'EPM',               UK:'EPM',               DE:null                  },

  // ── Watch handover ────────────────────────────────────────────────────────
  relieveWatch:     { US:'request permission to relieve the watch, sir',
                      UK:'request permission to relieve the watch, sir',
                      DE:'request to relieve the watch'               },
  watchMustering:   { US:'mustering',         UK:'mustering now',     DE:'standing to'         },
  assumedWatch:     { US:'has the deck',      UK:'on watch',          DE:'has the watch'       },
};

// ── Public API ──────────────────────────────────────────────────────────────

/** Return the current vessel nation ('US'|'UK'|'DE'). */
export function nation() {
  return CONFIG.player.nation || 'UK';
}

/**
 * Look up a terminology key for the current nation.
 * Falls back to UK if nation or key is missing.
 */
export function T(key) {
  const entry = TERMS[key];
  if (!entry) return key;
  const n = nation();
  return entry[n] !== undefined ? entry[n] : entry.UK;
}

/**
 * Convenience: get the station label for a compartment key.
 * Used by COMP_STATION mapping.
 */
export function stationLabel(compKey) {
  const map = {
    US: { fore_ends:'TOR', forward:'TOR', control_room:'CONN', aux_section:'AUX',
          reactor_comp:'REA', reactor:'REA', engine_room:'ENG', engineering:'ENG', aft_ends:'ENG' },
    UK: { fore_ends:'TOR', forward:'TOR', control_room:'CONN', aux_section:'AUX',
          reactor_comp:'REA', reactor:'REA', engine_room:'MAN', engineering:'MAN', aft_ends:'ENG' },
    DE: { fore_ends:'TORP', forward:'TORP', control_room:'CTRL', midships:'CTRL',
          aux_section:'CTRL', engine_room:'MACH', aft:'MACH', engineering:'MACH' },
  };
  const n = nation();
  return (map[n] || map.UK)[compKey] || 'CONN';
}
