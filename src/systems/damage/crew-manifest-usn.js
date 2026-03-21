'use strict';

// ── USN Crew Manifest ───────────────────────────────────────────────────────
// 90 named crew for US Navy submarines (688, 688i, Seawolf).
// Roles per Chapter 4A: OOD, DO, COW, FTOW, SONAR SUP, QMOW, EOOW, etc.
// USN ratings: CDR, LCDR, LT, LTJG, CPO, PO1, PO2, PO3, SN
// comp keys use legacy names (control_room, fore_ends, etc.) — mapped to
// active layout sections by buildCrewManifest().

export const CREW_MANIFEST_USN = [
  // ── CONTROL ROOM (20) ─────────────────────────────────────────────────
  // duty(4): Mitchell, Park, Delgado, Kowalski  |  A(8)  |  B(8)
  { id:'mitchell',  comp:'control_room', rating:'CDR',  firstName:'Robert',  lastName:'Mitchell',  role:'CO',       roleDesc:'Commanding Officer',                       gender:'m', watch:'duty', dcTeam:null    },
  { id:'park_usn',  comp:'control_room', rating:'LCDR', firstName:'Daniel',  lastName:'Park',      role:'XO',       roleDesc:'Executive Officer',                        gender:'m', watch:'duty', dcTeam:null    },
  { id:'delgado',   comp:'control_room', rating:'LT',   firstName:'Maria',   lastName:'Delgado',   role:'DCA',      roleDesc:'Damage Control Assistant / DC Alpha OIC',   gender:'f', watch:'duty', dcTeam:'alpha' },
  { id:'kowalski',  comp:'control_room', rating:'CPO',  firstName:'Stan',    lastName:'Kowalski',  role:'COW',      roleDesc:'Chief of the Watch / DC Alpha Senior Rate',  gender:'m', watch:'duty', dcTeam:'alpha' },
  // Watch A
  { id:'henderson', comp:'control_room', rating:'LT',   firstName:'James',   lastName:'Henderson', role:'OOD',      roleDesc:'Officer of the Deck',                      gender:'m', watch:'A',    dcTeam:null    },
  { id:'garcia',    comp:'control_room', rating:'LTJG', firstName:'Carlos',  lastName:'Garcia',    role:'DO',       roleDesc:'Diving Officer',                           gender:'m', watch:'A',    dcTeam:null    },
  { id:'williams',  comp:'control_room', rating:'CPO',  firstName:'Marcus',  lastName:'Williams',  role:'FTOW',     roleDesc:'Fire Control Technician of the Watch',      gender:'m', watch:'A',    dcTeam:null    },
  { id:'johnson_c', comp:'control_room', rating:'PO1',  firstName:'Kevin',   lastName:'Johnson',   role:'QMOW',     roleDesc:'Quartermaster of the Watch',               gender:'m', watch:'A',    dcTeam:null    },
  { id:'adams',     comp:'control_room', rating:'PO2',  firstName:'Tyler',   lastName:'Adams',     role:'HELM',     roleDesc:'Helmsman',                                 gender:'m', watch:'A',    dcTeam:null    },
  { id:'brooks',    comp:'control_room', rating:'PO2',  firstName:'Ryan',    lastName:'Brooks',    role:'PLANES',   roleDesc:'Planesman',                                gender:'m', watch:'A',    dcTeam:null    },
  { id:'campbell',  comp:'control_room', rating:'SN',   firstName:'Jake',    lastName:'Campbell',  role:'MSGR',     roleDesc:'Messenger of the Watch',                   gender:'m', watch:'A',    dcTeam:null    },
  { id:'diaz',      comp:'control_room', rating:'SN',   firstName:'Luis',    lastName:'Diaz',      role:'PHON',     roleDesc:'Phone Talker',                             gender:'m', watch:'A',    dcTeam:null    },
  // Watch B
  { id:'oconnell',  comp:'control_room', rating:'LT',   firstName:'Patrick', lastName:"O'Connell", role:'OOD',      roleDesc:'Officer of the Deck',                      gender:'m', watch:'B',    dcTeam:null    },
  { id:'nguyen',    comp:'control_room', rating:'LTJG', firstName:'Tran',    lastName:'Nguyen',    role:'DO',       roleDesc:'Diving Officer',                           gender:'m', watch:'B',    dcTeam:null    },
  { id:'martinez',  comp:'control_room', rating:'CPO',  firstName:'Rico',    lastName:'Martinez',  role:'FTOW',     roleDesc:'Fire Control Technician of the Watch',      gender:'m', watch:'B',    dcTeam:null    },
  { id:'lee_usn',   comp:'control_room', rating:'PO1',  firstName:'David',   lastName:'Lee',       role:'QMOW',     roleDesc:'Quartermaster of the Watch',               gender:'m', watch:'B',    dcTeam:null    },
  { id:'taylor_usn',comp:'control_room', rating:'PO2',  firstName:'Chris',   lastName:'Taylor',    role:'HELM',     roleDesc:'Helmsman',                                 gender:'m', watch:'B',    dcTeam:null    },
  { id:'white',     comp:'control_room', rating:'PO2',  firstName:'Sean',    lastName:'White',     role:'PLANES',   roleDesc:'Planesman',                                gender:'m', watch:'B',    dcTeam:null    },
  { id:'robinson',  comp:'control_room', rating:'SN',   firstName:'Zach',    lastName:'Robinson',  role:'MSGR',     roleDesc:'Messenger of the Watch',                   gender:'m', watch:'B',    dcTeam:null    },
  { id:'reed_usn',  comp:'control_room', rating:'SN',   firstName:'Amy',     lastName:'Reed',      role:'PHON',     roleDesc:'Phone Talker',                             gender:'f', watch:'B',    dcTeam:null    },
  // ── MEDICAL (2, sickbay) ──────────────────────────────────────────────
  { id:'morales',   comp:'aux_section', rating:'HMC',  firstName:'Elena',   lastName:'Morales',   role:'IDC',      roleDesc:'Independent Duty Corpsman',                  gender:'f', watch:'duty', dcTeam:null,    dept:'medical' },
  { id:'collins',   comp:'aux_section', rating:'HM2',  firstName:'Brandon', lastName:'Collins',   role:'HM',       roleDesc:'Hospital Corpsman',                          gender:'m', watch:'duty', dcTeam:null,    dept:'medical' },
  // ── FORE ENDS / SONAR / COMMS (25) ───────────────────────────────────
  // COMMS (4)
  { id:'jackson',   comp:'fore_ends', rating:'PO1',  firstName:'Mike',    lastName:'Jackson',   role:'RADIO SUP',roleDesc:'Radio Room Supervisor',                    gender:'m', watch:'A', dcTeam:null    },
  { id:'hall',      comp:'fore_ends', rating:'PO3',  firstName:'Jeff',    lastName:'Hall',      role:'RADIO',    roleDesc:'Radioman on Watch',                        gender:'m', watch:'A', dcTeam:null    },
  { id:'young',     comp:'fore_ends', rating:'PO1',  firstName:'Steve',   lastName:'Young',     role:'RADIO SUP',roleDesc:'Radio Room Supervisor',                    gender:'m', watch:'B', dcTeam:null    },
  { id:'king',      comp:'fore_ends', rating:'PO3',  firstName:'Matt',    lastName:'King',      role:'RADIO',    roleDesc:'Radioman on Watch',                        gender:'m', watch:'B', dcTeam:null    },
  // SONAR (6)
  { id:'powell',    comp:'fore_ends', rating:'CPO',  firstName:'Ray',     lastName:'Powell',    role:'SONAR SUP',roleDesc:'Sonar Supervisor',                         gender:'m', watch:'A', dcTeam:null    },
  { id:'rivera',    comp:'fore_ends', rating:'PO2',  firstName:'Tony',    lastName:'Rivera',    role:'STS',      roleDesc:'Sonar Technician on Watch',                gender:'m', watch:'A', dcTeam:null    },
  { id:'cooper',    comp:'fore_ends', rating:'PO3',  firstName:'Dan',     lastName:'Cooper',    role:'STS',      roleDesc:'Sonar Technician on Watch',                gender:'m', watch:'A', dcTeam:null    },
  { id:'bailey',    comp:'fore_ends', rating:'CPO',  firstName:'Walt',    lastName:'Bailey',    role:'SONAR SUP',roleDesc:'Sonar Supervisor',                         gender:'m', watch:'B', dcTeam:null    },
  { id:'sanchez',   comp:'fore_ends', rating:'PO2',  firstName:'Jose',    lastName:'Sanchez',   role:'STS',      roleDesc:'Sonar Technician on Watch',                gender:'m', watch:'B', dcTeam:null    },
  { id:'ramirez',   comp:'fore_ends', rating:'PO3',  firstName:'Alex',    lastName:'Ramirez',   role:'STS',      roleDesc:'Sonar Technician on Watch',                gender:'m', watch:'B', dcTeam:null    },
  // TORPEDO ROOM (15)
  { id:'bennett',   comp:'fore_ends', rating:'CPO',  firstName:'Tom',     lastName:'Bennett',   role:'TRS',      roleDesc:'Torpedo Room Supervisor',                  gender:'m', watch:'duty', dcTeam:null  },
  { id:'murphy',    comp:'fore_ends', rating:'PO1',  firstName:'Sean',    lastName:'Murphy',    role:'TM',       roleDesc:'Torpedoman on Watch',                      gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'rogers',    comp:'fore_ends', rating:'PO2',  firstName:'Kyle',    lastName:'Rogers',    role:'TM',       roleDesc:'Torpedoman on Watch',                      gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'stewart',   comp:'fore_ends', rating:'PO3',  firstName:'Greg',    lastName:'Stewart',   role:'TM',       roleDesc:'Torpedoman',                               gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'cook',      comp:'fore_ends', rating:'SN',   firstName:'Brian',   lastName:'Cook',      role:'TM',       roleDesc:'Torpedoman',                               gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'morgan',    comp:'fore_ends', rating:'SN',   firstName:'Nick',    lastName:'Morgan',    role:'TM',       roleDesc:'Torpedoman',                               gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'bell_usn',  comp:'fore_ends', rating:'SN',   firstName:'Drew',    lastName:'Bell',      role:'TM',       roleDesc:'Torpedoman',                               gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'ward_usn',  comp:'fore_ends', rating:'PO2',  firstName:'Pete',    lastName:'Ward',      role:'FE MAINT', roleDesc:'Fore Ends Maintenance',                    gender:'m', watch:'A', dcTeam:null    },
  { id:'price',     comp:'fore_ends', rating:'PO1',  firstName:'Vince',   lastName:'Price',     role:'TM',       roleDesc:'Torpedoman on Watch',                      gender:'m', watch:'B', dcTeam:null    },
  { id:'howard',    comp:'fore_ends', rating:'PO2',  firstName:'Derek',   lastName:'Howard',    role:'TM',       roleDesc:'Torpedoman on Watch',                      gender:'m', watch:'B', dcTeam:null    },
  { id:'perez',     comp:'fore_ends', rating:'PO3',  firstName:'Marco',   lastName:'Perez',     role:'TM',       roleDesc:'Torpedoman',                               gender:'m', watch:'B', dcTeam:null    },
  { id:'long',      comp:'fore_ends', rating:'SN',   firstName:'Billy',   lastName:'Long',      role:'TM',       roleDesc:'Torpedoman',                               gender:'m', watch:'B', dcTeam:null    },
  { id:'foster',    comp:'fore_ends', rating:'SN',   firstName:'Eric',    lastName:'Foster',    role:'TM',       roleDesc:'Torpedoman',                               gender:'m', watch:'B', dcTeam:null    },
  { id:'sanders',   comp:'fore_ends', rating:'SN',   firstName:'Lauren',  lastName:'Sanders',   role:'TM',       roleDesc:'Torpedoman',                               gender:'f', watch:'B', dcTeam:null    },
  { id:'butler',    comp:'fore_ends', rating:'PO2',  firstName:'Sam',     lastName:'Butler',    role:'FE MAINT', roleDesc:'Fore Ends Maintenance',                    gender:'m', watch:'B', dcTeam:null    },
  // ── SUPPLY / CATERING (5) ─────────────────────────────────────────────
  { id:'watson',    comp:'aux_section', rating:'CSC',   firstName:'George',  lastName:'Watson',   role:'CSMC',     roleDesc:'Culinary Specialist Master Chief',          gender:'m', watch:'duty', dcTeam:null, dept:'supply' },
  { id:'barnes',    comp:'aux_section', rating:'CS1',   firstName:'Rick',    lastName:'Barnes',   role:'CS',       roleDesc:'Culinary Specialist',                       gender:'m', watch:'duty', dcTeam:null, dept:'supply' },
  { id:'james_usn', comp:'aux_section', rating:'CS2',   firstName:'Linda',   lastName:'James',    role:'CS',       roleDesc:'Culinary Specialist',                       gender:'f', watch:'duty', dcTeam:null, dept:'supply' },
  { id:'gray',      comp:'aux_section', rating:'CS3',   firstName:'Danny',   lastName:'Gray',     role:'CS',       roleDesc:'Culinary Specialist',                       gender:'m', watch:'duty', dcTeam:null, dept:'supply' },
  { id:'russell',   comp:'aux_section', rating:'CSSN',  firstName:'Kate',    lastName:'Russell',  role:'CS',       roleDesc:'Culinary Specialist Seaman',                gender:'f', watch:'duty', dcTeam:null, dept:'supply' },
  // ── REACTOR COMP (3) ──────────────────────────────────────────────────
  { id:'shaw_usn',  comp:'reactor_comp', rating:'LCDR', firstName:'Paul',    lastName:'Shaw',     role:'ENG',      roleDesc:'Engineer Officer',                          gender:'m', watch:'duty', dcTeam:null },
  { id:'hayes_usn', comp:'reactor_comp', rating:'CPO',  firstName:'Doug',    lastName:'Hayes',    role:'RO',       roleDesc:'Reactor Operator',                          gender:'m', watch:'A',    dcTeam:null },
  { id:'fox_usn',   comp:'reactor_comp', rating:'PO1',  firstName:'Alan',    lastName:'Fox',      role:'RO',       roleDesc:'Reactor Operator',                          gender:'m', watch:'B',    dcTeam:null },
  // ── ENGINE ROOM (20) ──────────────────────────────────────────────────
  // A(11) | B(9) | DC Bravo: Peterson(OIC) + Crawford Mills_usn Perry Hoffman
  { id:'chen_usn',  comp:'engine_room', rating:'LT',   firstName:'David',   lastName:'Chen',     role:'EOOW',     roleDesc:'Engineering Officer of the Watch',          gender:'m', watch:'A',    dcTeam:null    },
  { id:'thompson',  comp:'engine_room', rating:'CPO',  firstName:'Bill',    lastName:'Thompson',  role:'THROT',    roleDesc:'Throttleman',                              gender:'m', watch:'A',    dcTeam:null    },
  { id:'peterson',  comp:'engine_room', rating:'CPO',  firstName:'Steve',   lastName:'Peterson',  role:'AUX',      roleDesc:'Aux Electrician Aft / DC Bravo Senior Rate',gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'crawford',  comp:'engine_room', rating:'PO1',  firstName:'Hugh',    lastName:'Crawford',  role:'MM',       roleDesc:'Machinist Mate on Watch',                  gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'mills_usn', comp:'engine_room', rating:'PO2',  firstName:'Rick',    lastName:'Mills',     role:'MM',       roleDesc:'Machinist Mate on Watch',                  gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'perry',     comp:'engine_room', rating:'PO2',  firstName:'Joe',     lastName:'Perry',     role:'ET',       roleDesc:'Electronics Technician on Watch',           gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'hoffman',   comp:'engine_room', rating:'PO3',  firstName:'Alan',    lastName:'Hoffman',   role:'MM',       roleDesc:'Machinist Mate',                           gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'morris',    comp:'engine_room', rating:'PO3',  firstName:'Connor',  lastName:'Morris',    role:'EM',       roleDesc:'Electrician Mate',                         gender:'m', watch:'A',    dcTeam:null    },
  { id:'ross',      comp:'engine_room', rating:'SN',   firstName:'Marco',   lastName:'Ross',      role:'MM',       roleDesc:'Machinist Mate Striker',                   gender:'m', watch:'A',    dcTeam:null    },
  { id:'wood',      comp:'engine_room', rating:'SN',   firstName:'Joe',     lastName:'Wood',      role:'MM',       roleDesc:'Machinist Mate Striker',                   gender:'m', watch:'A',    dcTeam:null    },
  { id:'fisher',    comp:'engine_room', rating:'SN',   firstName:'Rachel',  lastName:'Fisher',    role:'EM',       roleDesc:'Electrician Mate Striker',                  gender:'f', watch:'A',    dcTeam:null    },
  { id:'grant',     comp:'engine_room', rating:'LT',   firstName:'Colin',   lastName:'Grant',     role:'EOOW',     roleDesc:'Engineering Officer of the Watch',          gender:'m', watch:'B',    dcTeam:null    },
  { id:'walsh_usn', comp:'engine_room', rating:'CPO',  firstName:'Dennis',  lastName:'Walsh',     role:'THROT',    roleDesc:'Throttleman',                              gender:'m', watch:'B',    dcTeam:null    },
  { id:'harper_usn',comp:'engine_room', rating:'CPO',  firstName:'Fred',    lastName:'Harper',    role:'AUX',      roleDesc:'Aux Electrician Aft',                      gender:'m', watch:'B',    dcTeam:null    },
  { id:'sims',      comp:'engine_room', rating:'PO1',  firstName:'David',   lastName:'Sims',      role:'MM',       roleDesc:'Machinist Mate on Watch',                  gender:'m', watch:'B',    dcTeam:null    },
  { id:'kelly',     comp:'engine_room', rating:'PO2',  firstName:'Ray',     lastName:'Kelly',     role:'EM',       roleDesc:'Electrician Mate on Watch',                 gender:'m', watch:'B',    dcTeam:null    },
  { id:'hughes_usn',comp:'engine_room', rating:'PO3',  firstName:'Barry',   lastName:'Hughes',    role:'MM',       roleDesc:'Machinist Mate',                           gender:'m', watch:'B',    dcTeam:null    },
  { id:'webb_usn',  comp:'engine_room', rating:'PO3',  firstName:'Claire',  lastName:'Webb',      role:'ET',       roleDesc:'Electronics Technician',                   gender:'f', watch:'B',    dcTeam:null    },
  { id:'tucker',    comp:'engine_room', rating:'SN',   firstName:'Tim',     lastName:'Tucker',    role:'MM',       roleDesc:'Machinist Mate Striker',                   gender:'m', watch:'B',    dcTeam:null    },
  { id:'mason',     comp:'engine_room', rating:'SN',   firstName:'Dan',     lastName:'Mason',     role:'EM',       roleDesc:'Electrician Mate Striker',                  gender:'m', watch:'B',    dcTeam:null    },
  // ── AFT ENDS (15) ─────────────────────────────────────────────────────
  // DC Bravo OIC: Fleming. DC Bravo member: Ellis
  { id:'fleming',   comp:'aft_ends', rating:'LT',   firstName:'Owen',    lastName:'Fleming',   role:'E/H OFF',  roleDesc:'Electrical/Hydraulics Officer / DC Bravo OIC', gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'burns_usn', comp:'aft_ends', rating:'CPO',  firstName:'Dave',    lastName:'Burns',     role:'AFT CPO',  roleDesc:'Aft Section CPO on Watch',                   gender:'m', watch:'A',    dcTeam:null    },
  { id:'regan_usn', comp:'aft_ends', rating:'PO1',  firstName:'Phil',    lastName:'Regan',     role:'EO',       roleDesc:'Electrical Operator',                        gender:'m', watch:'A',    dcTeam:null    },
  { id:'fox2',      comp:'aft_ends', rating:'PO2',  firstName:'Darren',  lastName:'Fox',       role:'EM',       roleDesc:'Electrician Mate on Watch',                  gender:'m', watch:'A',    dcTeam:null    },
  { id:'fry_usn',   comp:'aft_ends', rating:'PO2',  firstName:'Jason',   lastName:'Fry',       role:'TA OP',    roleDesc:'Towed Array Operator',                       gender:'m', watch:'A',    dcTeam:null    },
  { id:'ellis',     comp:'aft_ends', rating:'SN',   firstName:'Russ',    lastName:'Ellis',     role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'shaw2',     comp:'aft_ends', rating:'SN',   firstName:'Liam',    lastName:'Shaw',      role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'m', watch:'A',    dcTeam:null    },
  { id:'palmer',    comp:'aft_ends', rating:'SN',   firstName:'Sam',     lastName:'Palmer',    role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'m', watch:'A',    dcTeam:null    },
  { id:'stone_usn', comp:'aft_ends', rating:'PO1',  firstName:'Harry',   lastName:'Stone',     role:'HYD',      roleDesc:'Hydraulics PO on Watch',                     gender:'m', watch:'B',    dcTeam:null    },
  { id:'drake_usn', comp:'aft_ends', rating:'PO2',  firstName:'Mike',    lastName:'Drake',     role:'EM',       roleDesc:'Electrician Mate on Watch',                  gender:'m', watch:'B',    dcTeam:null    },
  { id:'turner_usn',comp:'aft_ends', rating:'SN',   firstName:'Amy',     lastName:'Turner',    role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'f', watch:'B',    dcTeam:null    },
  { id:'cole_usn',  comp:'aft_ends', rating:'SN',   firstName:'Paul',    lastName:'Cole',      role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'m', watch:'B',    dcTeam:null    },
  { id:'west',      comp:'aft_ends', rating:'SN',   firstName:'Ben',     lastName:'West',      role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'m', watch:'B',    dcTeam:null    },
  { id:'todd_usn',  comp:'aft_ends', rating:'PO2',  firstName:'Graham',  lastName:'Todd',      role:'HYD',      roleDesc:'Hydraulics PO on Watch',                     gender:'m', watch:'B',    dcTeam:null    },
  { id:'bishop',    comp:'aft_ends', rating:'PO3',  firstName:'Andy',    lastName:'Bishop',    role:'TA OP',    roleDesc:'Towed Array Operator',                       gender:'m', watch:'B',    dcTeam:null    },
];
