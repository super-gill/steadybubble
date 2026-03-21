'use strict';

// ── Deutsche Marine Crew Manifest ───────────────────────────────────────────
// 35 named crew for Type 209.
// Roles per Chapter 4A: KDT, IWO, WO, LI, OSTM, ZM, SONM, TORM, etc.
// German names, German-flavoured English role descriptions.
// Ratings use Deutsche Marine abbreviations:
//   KptLt (Kapitänleutnant), OLtzS (Oberleutnant zur See), LtzS (Leutnant zur See),
//   StOBtsm (Stabsobersteuermann), OBtsm (Obersteuermann), Btsm (Bootsmann),
//   Maat (Maat), OGfr (Obergefreiter), HGfr (Hauptgefreiter)
// comp keys: control_room → midships, fore_ends → forward, engine_room → aft

export const CREW_MANIFEST_DE = [
  // ── CONTROL / MIDSHIPS (14) ───────────────────────────────────────────
  // duty(3): Brandt, Hoffmann, Richter  |  A(5-6)  |  B(5-6)
  { id:'brandt',    comp:'control_room', rating:'KptLt',  firstName:'Klaus',    lastName:'Brandt',    role:'KDT',    roleDesc:'Kommandant',                               gender:'m', watch:'duty', dcTeam:null    },
  { id:'hoffmann',  comp:'control_room', rating:'OLtzS',  firstName:'Stefan',   lastName:'Hoffmann',  role:'IWO',    roleDesc:'Erster Wachoffizier',                      gender:'m', watch:'duty', dcTeam:null    },
  { id:'richter',   comp:'control_room', rating:'OBtsm',  firstName:'Hans',     lastName:'Richter',   role:'OSTM',   roleDesc:'Obersteuermann — Navigation',              gender:'m', watch:'duty', dcTeam:null    },
  // Watch A
  { id:'weber',     comp:'control_room', rating:'LtzS',   firstName:'Marc',     lastName:'Weber',     role:'WO',     roleDesc:'Wachoffizier',                             gender:'m', watch:'A',    dcTeam:null    },
  { id:'schulz',    comp:'control_room', rating:'Btsm',   firstName:'Jens',     lastName:'Schulz',    role:'ZM',     roleDesc:'Zentralemaat — Central Systems',           gender:'m', watch:'A',    dcTeam:null    },
  { id:'krueger',   comp:'control_room', rating:'Maat',   firstName:'Tobias',   lastName:'Krüger',    role:'SONM',   roleDesc:'Sonarmeister — Sonar Watchkeeper',         gender:'m', watch:'A',    dcTeam:null    },
  { id:'becker',    comp:'control_room', rating:'Maat',   firstName:'Dirk',     lastName:'Becker',    role:'FUNK',   roleDesc:'Funker — Radio Operator',                  gender:'m', watch:'A',    dcTeam:null    },
  { id:'vogel',     comp:'control_room', rating:'OGfr',   firstName:'Lars',     lastName:'Vogel',     role:'RUDG',   roleDesc:'Rudergänger — Helmsman',                   gender:'m', watch:'A',    dcTeam:null    },
  // Watch B
  { id:'hartmann',  comp:'control_room', rating:'LtzS',   firstName:'Erik',     lastName:'Hartmann',  role:'WO',     roleDesc:'Wachoffizier',                             gender:'m', watch:'B',    dcTeam:null    },
  { id:'lang',      comp:'control_room', rating:'Btsm',   firstName:'Michael',  lastName:'Lang',      role:'ZM',     roleDesc:'Zentralemaat — Central Systems',           gender:'m', watch:'B',    dcTeam:null    },
  { id:'frank',     comp:'control_room', rating:'Maat',   firstName:'Peter',    lastName:'Frank',     role:'SONM',   roleDesc:'Sonarmeister — Sonar Watchkeeper',         gender:'m', watch:'B',    dcTeam:null    },
  { id:'klein',     comp:'control_room', rating:'Maat',   firstName:'Uwe',      lastName:'Klein',     role:'FUNK',   roleDesc:'Funker — Radio Operator',                  gender:'m', watch:'B',    dcTeam:null    },
  { id:'schaefer',  comp:'control_room', rating:'OGfr',   firstName:'Nils',     lastName:'Schäfer',   role:'RUDG',   roleDesc:'Rudergänger — Helmsman',                   gender:'m', watch:'B',    dcTeam:null    },
  // ── MEDICAL (1) ───────────────────────────────────────────────────────
  { id:'baumann',   comp:'aux_section',  rating:'Maat',   firstName:'Karl',     lastName:'Baumann',   role:'SANM',   roleDesc:'Sanitätsmaat — Medical',                   gender:'m', watch:'duty', dcTeam:null,    dept:'medical' },
  // ── FORWARD / TORPEDO ROOM (12) ───────────────────────────────────────
  // duty(1): Roth  |  A(5-6): DC Alpha  |  B(5-6)
  { id:'roth',      comp:'fore_ends',    rating:'OBtsm',  firstName:'Werner',   lastName:'Roth',      role:'TORM',   roleDesc:'Torpedomeister — Torpedo Room Supervisor',  gender:'m', watch:'duty', dcTeam:null    },
  // Watch A — DC Alpha
  { id:'fischer',   comp:'fore_ends',    rating:'Btsm',   firstName:'Markus',   lastName:'Fischer',   role:'TORP',   roleDesc:'Torpedo Technician on Watch',              gender:'m', watch:'A',    dcTeam:'alpha' },
  { id:'zimmermann',comp:'fore_ends',    rating:'Maat',   firstName:'Thomas',   lastName:'Zimmermann', role:'TORP',  roleDesc:'Torpedo Technician',                       gender:'m', watch:'A',    dcTeam:'alpha' },
  { id:'meyer',     comp:'fore_ends',    rating:'OGfr',   firstName:'Sven',     lastName:'Meyer',     role:'TORP',   roleDesc:'Torpedo Rating',                           gender:'m', watch:'A',    dcTeam:'alpha' },
  { id:'wagner',    comp:'fore_ends',    rating:'OGfr',   firstName:'Jan',      lastName:'Wagner',    role:'TORP',   roleDesc:'Torpedo Rating',                           gender:'m', watch:'A',    dcTeam:'alpha' },
  { id:'schmitt',   comp:'fore_ends',    rating:'HGfr',   firstName:'Felix',    lastName:'Schmitt',   role:'TORP',   roleDesc:'Torpedo Rating',                           gender:'m', watch:'A',    dcTeam:'alpha' },
  // Watch B
  { id:'koch',      comp:'fore_ends',    rating:'Btsm',   firstName:'Ralf',     lastName:'Koch',      role:'TORP',   roleDesc:'Torpedo Technician on Watch',              gender:'m', watch:'B',    dcTeam:null    },
  { id:'braun',     comp:'fore_ends',    rating:'Maat',   firstName:'Oliver',   lastName:'Braun',     role:'TORP',   roleDesc:'Torpedo Technician',                       gender:'m', watch:'B',    dcTeam:null    },
  { id:'engel',     comp:'fore_ends',    rating:'OGfr',   firstName:'Kai',      lastName:'Engel',     role:'TORP',   roleDesc:'Torpedo Rating',                           gender:'m', watch:'B',    dcTeam:null    },
  { id:'wolf',      comp:'fore_ends',    rating:'OGfr',   firstName:'Nico',     lastName:'Wolf',      role:'TORP',   roleDesc:'Torpedo Rating',                           gender:'m', watch:'B',    dcTeam:null    },
  { id:'schuster',  comp:'fore_ends',    rating:'HGfr',   firstName:'Tim',      lastName:'Schuster',  role:'TORP',   roleDesc:'Torpedo Rating',                           gender:'m', watch:'B',    dcTeam:null    },
  // ── SUPPLY (1, mess) ──────────────────────────────────────────────────
  { id:'seidel',    comp:'aux_section',  rating:'Maat',   firstName:'Bernd',    lastName:'Seidel',    role:'VMAT',   roleDesc:'Versorgungsmaat — Supply/Cook',             gender:'m', watch:'duty', dcTeam:null,    dept:'supply' },
  // ── AFT / ENGINE COMPARTMENT (9) ──────────────────────────────────────
  // duty(1): Lehmann  |  A(4): DC Bravo  |  B(4)
  { id:'lehmann',   comp:'engine_room',  rating:'OLtzS',  firstName:'Dieter',   lastName:'Lehmann',   role:'LI',     roleDesc:'Leitender Ingenieur — Chief Engineer',     gender:'m', watch:'duty', dcTeam:null    },
  // Watch A — DC Bravo
  { id:'huber',     comp:'engine_room',  rating:'Btsm',   firstName:'Georg',    lastName:'Huber',     role:'MASM',   roleDesc:'Maschinenmaat — Machinery Watch',          gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'keller',    comp:'engine_room',  rating:'Maat',   firstName:'Axel',     lastName:'Keller',    role:'EMAT',   roleDesc:'Elektromaat — Electrical Watch',            gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'maier',     comp:'engine_room',  rating:'OGfr',   firstName:'Lutz',     lastName:'Maier',     role:'MECH',   roleDesc:'Engine Rating',                            gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'neumann',   comp:'engine_room',  rating:'HGfr',   firstName:'Falk',     lastName:'Neumann',   role:'MECH',   roleDesc:'Engine Rating',                            gender:'m', watch:'A',    dcTeam:'bravo' },
  // Watch B
  { id:'schwarz',   comp:'engine_room',  rating:'Btsm',   firstName:'Jochen',   lastName:'Schwarz',   role:'MASM',   roleDesc:'Maschinenmaat — Machinery Watch',          gender:'m', watch:'B',    dcTeam:null    },
  { id:'mueller',   comp:'engine_room',  rating:'Maat',   firstName:'Heiko',    lastName:'Müller',    role:'EMAT',   roleDesc:'Elektromaat — Electrical Watch',            gender:'m', watch:'B',    dcTeam:null    },
  { id:'bergmann',  comp:'engine_room',  rating:'OGfr',   firstName:'Rainer',   lastName:'Bergmann',  role:'MECH',   roleDesc:'Engine Rating',                            gender:'m', watch:'B',    dcTeam:null    },
  { id:'horn',      comp:'engine_room',  rating:'HGfr',   firstName:'Dennis',   lastName:'Horn',      role:'MECH',   roleDesc:'Engine Rating',                            gender:'m', watch:'B',    dcTeam:null    },
];
