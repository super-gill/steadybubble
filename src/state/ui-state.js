'use strict';

// ── UI state — render/input layer only ───────────────────────────────────────

export const ui = {
  // ── Panel toggles ──────────────────────────────────────────────────────────
  logTab: 'log',           // 'log' | 'dc'
  showDcPanel: false,
  showCrewPanel: false,
  showDamageScreen: false,

  // ── Scroll positions ──────────────────────────────────────────────────────
  contactsScroll: 0,
  startScrollY: 0,
  vesselScrollY: 0,

  // ── Start screen navigation ────────────────────────────────────────────────
  startPhase: 'scenario',  // 'scenario' | 'vessel' | 'loadout'
  vesselTab: 'player',

  // ── Damage screen selected watchspace ──────────────────────────────────────
  selectedWatchspace: null,  // room ID (e.g. 'fwd_control') or null

  // ── Weapons proposal (pending fire solution) ───────────────────────────────
  wepsProposal: null,
};
