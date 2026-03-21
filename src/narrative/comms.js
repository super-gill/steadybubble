'use strict';

import { setMsg, addLog, session } from '../state/session-state.js';
import { queueLog } from '../state/sim-state.js';
import { T, nation, stationLabel } from './terminology.js';

// ── Priority constants ───────────────────────────────────────────────────
export const P = { NORMAL:0, MED:1, CRIT:2 };

// ── Wrappers so comms.js can pass priority cleanly ───────────────────────
export function log(cat, text, priority=P.NORMAL)  { addLog(cat, text, priority); }
export function qlog(cat, text, delay, priority=P.NORMAL) { queueLog(cat, text, delay, priority); }
export function msg(text, t=1.2)                   { setMsg(text, t); }

// ── DC log (events panel) ────────────────────────────────────────────────
export function dcLog(text, priority=P.NORMAL) {
  if (!session.dcLog) session.dcLog = [];
  session.dcLog.push({ t: session.missionT || 0, text, priority });
  if (session.dcLog.length > 120) session.dcLog.shift();
}

// ── Station → compartment map (now dynamic per nation) ───────────────────
// Legacy static object kept for backwards compatibility — consumers that read
// COMP_STATION[key] still work. But callers should prefer stationLabel(key).
export const COMP_STATION = {
  fore_ends:    'TOR',
  control_room: 'CONN',
  aux_section:  'AUX',
  reactor_comp: 'REA',
  engine_room:  'MAN',
  aft_ends:     'ENG',
};

// Dynamic station label — use this in new code.
export { stationLabel };

// ── Voice templates (moved to voice.js + voice-ops.js) ───────────────────
import { flood, dc, sys, reactor, escape, planes, combat, weapons } from './voice.js';
import { nav, sensors, tactical, depth, trim, fire, medical, watch, snorkel, mast,
         hydraulic, shaftSeal, hydrogen, hotRun, snorkelFlood, chlorine } from './voice-ops.js';

// ════════════════════════════════════════════════════════════════════════
// PANEL / SPEED ORDERS
// ════════════════════════════════════════════════════════════════════════
export const panel = {
  speedOrder(label, connOrder, engAck) {
    msg(label, 1.0);
    log(T('stConn'), connOrder);
    qlog(T('stEng'), engAck, 1.2);
  },
  speedOrderRelay(label, connOrder, engAck) {
    msg(label, 1.0);
    const coOrder = connOrder.replace(/^Eng, Conn\s*—/, `${T('maneuvering')}, ${T('co')} —`);
    log(T('stCO'), coOrder, P.MED);
    qlog(T('stEng'),  `${T('co')}, ${T('maneuvering')} — order received, ${T('aye')}`, 2.5);
    qlog(T('stEng'),  engAck, 5.0);
  },
};

// ════════════════════════════════════════════════════════════════════════
// UI FEEDBACK (setMsg only)
// ════════════════════════════════════════════════════════════════════════
export const commsUi = {
  periscopeTooDeep()      { msg('PERISCOPE: TOO DEEP', 1.0); },
  periscopeDamaged()      { msg('PERISCOPE: DAMAGED — UNAVAILABLE', 1.0); },
  scopeReport(shown)      { msg(shown > 0 ? `SCOPE: ${shown} ship(s)` : 'SCOPE: no ships', 1.2); },
  sonarOffline()          { msg('SONAR OFFLINE — SCRAM', 0.8); },
  ping()                  { msg('PING!', 0.8); },
  shipCountermeasures()   { msg('SHIP: COUNTERMEASURES!', 0.8); },
  cwisIntercept()         { msg('CWIS INTERCEPT!', 1.0); },
  emergencyTurnCooldown() { msg('EMERGENCY TURN COOLING DOWN', 0.8); },
};

// ════════════════════════════════════════════════════════════════════════
// CREW STATE TRANSITIONS (nation-aware)
// ════════════════════════════════════════════════════════════════════════
export const crewState = {
  actionStations(cause) {
    const as3 = T('actionStations3x');
    const lines = {
      torpedo: `${T('connAll')} — ${as3}: Torpedo threat. Close up evasion stations.`,
      contact: `${T('connAll')} — ${as3}: Submerged contact prosecuted. Close up ${T('actionStations').toLowerCase()}.`,
      attack:  `${T('connAll')} — ${as3}: Weapons free. Close up ${T('actionStations').toLowerCase()}.`,
      wave:    `${T('connAll')} — ${as3}: Multiple contacts. Close up ${T('actionStations').toLowerCase()}.`,
      manual:  `${T('connAll')} — ${as3}: Assume defence watches.`,
    };
    log(T('stConn'), lines[cause] || lines.manual, P.CRIT);
    msg(T('actionStationsU'), 2.0);
  },
  patrolState() {
    log(T('stConn'), `${T('connAll')} — close up patrol state. Contact possible. Assume war watches.`, P.MED);
    msg('PATROL STATE', 1.5);
  },
  standDown(fromState) {
    if (fromState === 'action') {
      log(T('stConn'), `${T('connAll')} — ${T('standDown')} ${T('actionStations').toLowerCase()}. Assume cruising watch.`, P.MED);
      qlog(T('stEng'),  `${T('engConn')} — ${T('aye')}. Securing action state equipment.`, 1.5);
      qlog(T('stWeps'), `${T('wepsConn')} — ${T('aye')}. Weapons safed. Tubes drained.`, 2.5);
      msg('STAND DOWN — CRUISING WATCH', 1.5);
    } else {
      log(T('stConn'), `${T('connAll')} — ${T('standDown')} normal watch routine.`, P.MED);
      msg('NORMAL WATCH', 1.2);
    }
  },
  emergencyStations(cause) {
    const es3 = T('emergencyStations3x');
    const lines = {
      flood:   `${T('connAll')} — ${es3}: Flood, flood, flood. DC teams close up.`,
      reactor: `${T('connAll')} — ${es3}: Reactor casualty. Close up emergency stations.`,
      fire:    `${T('connAll')} — ${es3}: Fire, fire, fire. Close up emergency stations.`,
    };
    log(T('stConn'), lines[cause] || `${T('connAll')} — ${es3}: Close up emergency stations.`, P.CRIT);
    msg(T('emergencyStations'), 2.5);
  },
  casualtyControlled(cause) {
    const lines = {
      flood: `${T('connAll')} — flooding casualty controlled. Secure from emergency stations. Resume normal watch.`,
      fire:  `${T('connAll')} — fire casualty controlled. Secure from emergency stations. Resume normal watch.`,
    };
    log(T('stConn'), lines[cause] || `${T('connAll')} — casualty controlled. Secure from emergency stations.`, P.MED);
    msg('CASUALTY CONTROLLED', 1.5);
  },
  escapeStations() {
    log(T('stConn'), `${T('connAll')} — ${T('escapeStations3x')}: Abandon ship. This is not a drill.`, P.CRIT);
    msg(T('escapeStations'), 3.0);
  },
};

// ════════════════════════════════════════════════════════════════════════
// AGGREGATE EXPORT (mirrors V1 window.COMMS shape)
// ════════════════════════════════════════════════════════════════════════
export const COMMS = {
  P, COMP_STATION, dcLog, flood, dc, sys, reactor, escape, combat, weapons,
  nav, sensors, tactical, panel, ui: commsUi, crewState, depth, trim, planes,
  fire, watch, medical, snorkel, mast, hydraulic, shaftSeal, hydrogen, hotRun,
  snorkelFlood, chlorine,
};
