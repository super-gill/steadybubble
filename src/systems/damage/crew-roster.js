'use strict';

import { COMPS, COMP_DEF } from './damage-data.js';
import { player } from '../../state/sim-state.js';
import { clamp } from '../../utils/math.js';
import { nation } from '../../narrative/terminology.js';

// ── Per-nation crew manifests ───────────────────────────────────────────────
import { CREW_MANIFEST_USN } from './crew-manifest-usn.js';
import { CREW_MANIFEST_DE }  from './crew-manifest-de.js';

// ── RN manifest (kept inline — this is the original) ────────────────────────
export const CREW_MANIFEST_RN = [
  // ── CONTROL ROOM (20) ─────────────────────────────────────────────────
  { id:'ramsay',   comp:'control_room', rating:'CDR',  firstName:'Michael', lastName:'Ramsay',   role:'CO',       roleDesc:'Commanding Officer',                    gender:'m', watch:'duty', dcTeam:null    },
  { id:'chen',     comp:'control_room', rating:'LCDR', firstName:'Sarah',   lastName:'Chen',     role:'XO',       roleDesc:'Executive Officer',                     gender:'f', watch:'duty', dcTeam:null    },
  { id:'fenwick',  comp:'control_room', rating:'LT',   firstName:'Thomas',  lastName:'Fenwick',  role:'1ST LT',   roleDesc:'First Lieutenant / DC Alpha OIC',        gender:'m', watch:'duty', dcTeam:'alpha' },
  { id:'crane',    comp:'control_room', rating:'WO',   firstName:'Robert',  lastName:'Crane',    role:"COX'N",    roleDesc:'Coxswain / DC Alpha Senior Rate',         gender:'m', watch:'duty', dcTeam:'alpha' },
  { id:'hartley',  comp:'control_room', rating:'LT',   firstName:'James',   lastName:'Hartley',  role:'OOW',      roleDesc:'Officer of the Watch',                   gender:'m', watch:'A',    dcTeam:null    },
  { id:'walsh',    comp:'control_room', rating:'CPO',  firstName:'Brian',   lastName:'Walsh',    role:'SON CTL',  roleDesc:'Sonar Controller',                       gender:'m', watch:'A',    dcTeam:null    },
  { id:'spencer',  comp:'control_room', rating:'PO',   firstName:'Mark',    lastName:'Spencer',  role:'PLNSMN',   roleDesc:'Planesman',                              gender:'m', watch:'A',    dcTeam:null    },
  { id:'curtis',   comp:'control_room', rating:'PO',   firstName:'Lee',     lastName:'Curtis',   role:'HELSMN',   roleDesc:'Helmsman',                               gender:'m', watch:'A',    dcTeam:null    },
  { id:'henley',   comp:'control_room', rating:'LS',   firstName:'Paul',    lastName:'Henley',   role:'NAV PLT',  roleDesc:'Navigation Plotter',                     gender:'m', watch:'A',    dcTeam:null    },
  { id:'vane',     comp:'control_room', rating:'PO',   firstName:'Simon',   lastName:'Vane',     role:'TDC OP',   roleDesc:'TDC Operator',                           gender:'m', watch:'A',    dcTeam:null    },
  { id:'frazer',   comp:'control_room', rating:'AB',   firstName:'Steve',   lastName:'Frazer',   role:'CR RTG',   roleDesc:'Control Room Rating',                    gender:'m', watch:'A',    dcTeam:null    },
  { id:'wren',     comp:'control_room', rating:'AB',   firstName:'Jack',    lastName:'Wren',     role:'CR RTG',   roleDesc:'Control Room Rating',                    gender:'m', watch:'A',    dcTeam:null    },
  { id:'kirby',    comp:'control_room', rating:'LT',   firstName:'David',   lastName:'Kirby',    role:'OOW',      roleDesc:'Officer of the Watch',                   gender:'m', watch:'B',    dcTeam:null    },
  { id:'thatcher', comp:'control_room', rating:'CPO',  firstName:'Neil',    lastName:'Thatcher', role:'SON CTL',  roleDesc:'Sonar Controller',                       gender:'m', watch:'B',    dcTeam:null    },
  { id:'nolan',    comp:'control_room', rating:'PO',   firstName:'Gary',    lastName:'Nolan',    role:'PLNSMN',   roleDesc:'Planesman',                              gender:'m', watch:'B',    dcTeam:null    },
  { id:'doyle',    comp:'control_room', rating:'LS',   firstName:'Mike',    lastName:'Doyle',    role:'HELSMN',   roleDesc:'Helmsman',                               gender:'m', watch:'B',    dcTeam:null    },
  { id:'booth',    comp:'control_room', rating:'LS',   firstName:'Craig',   lastName:'Booth',    role:'SON OP',   roleDesc:'Sonar Operator',                         gender:'m', watch:'B',    dcTeam:null    },
  { id:'marsh',    comp:'control_room', rating:'LS',   firstName:'Dean',    lastName:'Marsh',    role:'RADIO',    roleDesc:'Radio Operator',                         gender:'m', watch:'B',    dcTeam:null    },
  { id:'peel',     comp:'control_room', rating:'AB',   firstName:'Tom',     lastName:'Peel',     role:'CR RTG',   roleDesc:'Control Room Rating',                    gender:'m', watch:'B',    dcTeam:null    },
  { id:'briggs',   comp:'control_room', rating:'AB',   firstName:'Chloe',   lastName:'Briggs',   role:'CR RTG',   roleDesc:'Control Room Rating',                    gender:'f', watch:'B',    dcTeam:null    },
  // ── MEDICAL (2, sickbay in aux_section D3) ────────────────────────────
  { id:'oconnor',  comp:'aux_section', rating:'LMA',  firstName:'Patrick', lastName:"O'Connor", role:'LMA',      roleDesc:'Leading Medical Assistant — Sickbay',        gender:'m', watch:'duty', dcTeam:null,    dept:'medical' },
  { id:'hayes',    comp:'aux_section', rating:'MA',   firstName:'Claire',  lastName:'Hayes',    role:'MA',       roleDesc:'Medical Assistant — Sickbay',                gender:'f', watch:'duty', dcTeam:null,    dept:'medical' },
  // ── FORE ENDS (25) ────────────────────────────────────────────────────
  { id:'sadler',   comp:'fore_ends', rating:'PO',  firstName:'Frank',  lastName:'Sadler',  role:'COMMS PO', roleDesc:'Communications PO on Watch',             gender:'m', watch:'A', dcTeam:null    },
  { id:'pearce',   comp:'fore_ends', rating:'AB',  firstName:'Aiden',  lastName:'Pearce',  role:'COMMS OP', roleDesc:'Communications Operator on Watch',       gender:'m', watch:'A', dcTeam:null    },
  { id:'nash',     comp:'fore_ends', rating:'CPO', firstName:'Frank',  lastName:'Nash',    role:'COMMS CPO',roleDesc:'Chief Petty Officer Communications',      gender:'m', watch:'B', dcTeam:null    },
  { id:'morton',   comp:'fore_ends', rating:'LS',  firstName:'Pete',   lastName:'Morton',  role:'COMMS OP', roleDesc:'Communications Operator on Watch',       gender:'m', watch:'B', dcTeam:null    },
  { id:'jacobs',   comp:'fore_ends', rating:'CPO', firstName:'Ron',    lastName:'Jacobs',  role:'COW(T)',   roleDesc:'Chief of the Watch (Torpedo)',           gender:'m', watch:'duty', dcTeam:null  },
  { id:'drake',    comp:'fore_ends', rating:'PO',  firstName:'Kevin',  lastName:'Drake',   role:'TRP RDY',  roleDesc:'Torpedo Ready Duty',                    gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'reeves',   comp:'fore_ends', rating:'LS',  firstName:'Tony',   lastName:'Reeves',  role:'TORP',     roleDesc:'Torpedo Rating on Watch',                gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'shaw',     comp:'fore_ends', rating:'LS',  firstName:'Gary',   lastName:'Shaw',    role:'TORP',     roleDesc:'Torpedo Rating on Watch',                gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'cullen',   comp:'fore_ends', rating:'AB',  firstName:'Lee',    lastName:'Cullen',  role:'TORP',     roleDesc:'Torpedo Tube Maintainer',                gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'lane',     comp:'fore_ends', rating:'AB',  firstName:'Chris',  lastName:'Lane',    role:'TORP',     roleDesc:'Torpedo Rating',                         gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'hobbs',    comp:'fore_ends', rating:'AB',  firstName:'Nick',   lastName:'Hobbs',   role:'SON OP',   roleDesc:'Sonar Operator',                         gender:'m', watch:'A', dcTeam:'alpha' },
  { id:'dunn',     comp:'fore_ends', rating:'LS',  firstName:'Bobby',  lastName:'Dunn',    role:'FE MAINT', roleDesc:'Fore Ends Maintenance',                  gender:'m', watch:'A', dcTeam:null    },
  { id:'quinn',    comp:'fore_ends', rating:'LS',  firstName:'Ben',    lastName:'Quinn',   role:'FE LS',    roleDesc:'Fore Ends Leading Seaman',               gender:'m', watch:'A', dcTeam:null    },
  { id:'burns',    comp:'fore_ends', rating:'PO',  firstName:'Andy',   lastName:'Burns',   role:'SON PO',   roleDesc:'Sonar PO on Watch',                      gender:'m', watch:'B', dcTeam:null    },
  { id:'cole',     comp:'fore_ends', rating:'PO',  firstName:'Martin', lastName:'Cole',    role:'TRP RDY',  roleDesc:'Torpedo Ready Duty',                     gender:'m', watch:'B', dcTeam:null    },
  { id:'porter',   comp:'fore_ends', rating:'LS',  firstName:'Sam',    lastName:'Porter',  role:'SON LS',   roleDesc:'Sonar Leading Seaman on Watch',           gender:'m', watch:'B', dcTeam:null    },
  { id:'holt',     comp:'fore_ends', rating:'AB',  firstName:'Phil',   lastName:'Holt',    role:'TORP',     roleDesc:'Torpedo Rating',                         gender:'m', watch:'B', dcTeam:null    },
  { id:'finch',    comp:'fore_ends', rating:'AB',  firstName:'Joe',    lastName:'Finch',   role:'TORP',     roleDesc:'Torpedo Rating',                         gender:'m', watch:'B', dcTeam:null    },
  { id:'baxter',   comp:'fore_ends', rating:'PO',  firstName:'Stuart', lastName:'Baxter',  role:'FE PO',    roleDesc:'Fore Ends PO on Watch',                  gender:'m', watch:'B', dcTeam:null    },
  { id:'frost',    comp:'fore_ends', rating:'AB',  firstName:'Dave',   lastName:'Frost',   role:'TORP',     roleDesc:'Torpedo Rating',                         gender:'m', watch:'B', dcTeam:null    },
  { id:'pratt',    comp:'fore_ends', rating:'AB',  firstName:'Ray',    lastName:'Pratt',   role:'TORP',     roleDesc:'Torpedo Rating',                         gender:'m', watch:'B', dcTeam:null    },
  { id:'norris',   comp:'fore_ends', rating:'AB',  firstName:'Emma',   lastName:'Norris',  role:'SON OP',   roleDesc:'Sonar Operator',                         gender:'f', watch:'B', dcTeam:null    },
  { id:'flynn',    comp:'fore_ends', rating:'AB',  firstName:'Danny',  lastName:'Flynn',   role:'TORP',     roleDesc:'Torpedo Rating',                         gender:'m', watch:'B', dcTeam:null    },
  // ── SUPPLY / CATERING (5) ─────────────────────────────────────────────
  { id:'taylor',   comp:'aux_section', rating:'CPOSA', firstName:'George', lastName:'Taylor',  role:'CPOSA',    roleDesc:'Chief Petty Officer Supply & Secretariat', gender:'m', watch:'duty', dcTeam:null, dept:'supply' },
  { id:'mackay',   comp:'aux_section', rating:'PO',    firstName:'Ian',    lastName:'MacKay',  role:'PO(CS)',   roleDesc:'Petty Officer Catering Services',           gender:'m', watch:'duty', dcTeam:null, dept:'supply' },
  { id:'wright',   comp:'aux_section', rating:'PO',    firstName:'Linda',  lastName:'Wright',  role:'PO(CS)',   roleDesc:'Petty Officer Catering Services',           gender:'f', watch:'duty', dcTeam:null, dept:'supply' },
  { id:'cross',    comp:'aux_section', rating:'AB',    firstName:'Danny',  lastName:'Cross',   role:'AB(CS)',   roleDesc:'Able Rating Catering Services',             gender:'m', watch:'duty', dcTeam:null, dept:'supply' },
  { id:'reed',     comp:'aux_section', rating:'AB',    firstName:'Kate',   lastName:'Reed',    role:'AB(CS)',   roleDesc:'Able Rating Catering Services',             gender:'f', watch:'duty', dcTeam:null, dept:'supply' },
  // ── REACTOR COMP (3) ──────────────────────────────────────────────────
  { id:'sinclair', comp:'reactor_comp', rating:'LCDR', firstName:'Paul',  lastName:'Sinclair', role:'MEO',      roleDesc:'Marine Engineering Officer',            gender:'m', watch:'duty', dcTeam:null },
  { id:'hadley',   comp:'reactor_comp', rating:'CPO',  firstName:'Doug',  lastName:'Hadley',   role:'REAC WKP', roleDesc:'Reactor Panel Watchkeeper',              gender:'m', watch:'A',    dcTeam:null },
  { id:'merritt',  comp:'reactor_comp', rating:'PO',   firstName:'Alan',  lastName:'Merritt',  role:'REAC WKP', roleDesc:'Reactor Panel Watchkeeper',              gender:'m', watch:'B',    dcTeam:null },
  // ── ENGINE ROOM (20) ──────────────────────────────────────────────────
  { id:'ward',     comp:'engine_room', rating:'LT',  firstName:'Rachel', lastName:'Ward',     role:'MRWO',     roleDesc:'Manoeuvring Room Watch Officer',         gender:'f', watch:'A',    dcTeam:null    },
  { id:'tanner',   comp:'engine_room', rating:'WO',  firstName:'John',   lastName:'Tanner',   role:'WO PROP',  roleDesc:'WO Propulsion on Watch',                 gender:'m', watch:'A',    dcTeam:null    },
  { id:'burke',    comp:'engine_room', rating:'CPO', firstName:'Steve',  lastName:'Burke',    role:'EPNS CPO', roleDesc:'EPNS CPO on Watch / DC Bravo Senior Rate',gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'greer',    comp:'engine_room', rating:'CPO', firstName:'Hugh',   lastName:'Greer',    role:'MECH CPO', roleDesc:'Mechanical Systems CPO',                 gender:'m', watch:'A',    dcTeam:null    },
  { id:'kent',     comp:'engine_room', rating:'PO',  firstName:'Larry',  lastName:'Kent',     role:'PROP PO',  roleDesc:'Propulsion PO on Watch',                 gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'moss',     comp:'engine_room', rating:'PO',  firstName:'Alan',   lastName:'Moss',     role:'MECH PO',  roleDesc:'Mechanical PO on Watch',                 gender:'m', watch:'A',    dcTeam:null    },
  { id:'mills',    comp:'engine_room', rating:'LS',  firstName:'Victor', lastName:'Mills',    role:'PROP LS',  roleDesc:'Propulsion Leading Seaman on Watch',      gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'kemp',     comp:'engine_room', rating:'LS',  firstName:'Ryan',   lastName:'Kemp',     role:'MECH LS',  roleDesc:'Mechanical Leading Seaman on Watch',      gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'hughes',   comp:'engine_room', rating:'AB',  firstName:'Connor', lastName:'Hughes',   role:'MECH RTG', roleDesc:'Mechanical Rating',                       gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'silva',    comp:'engine_room', rating:'AB',  firstName:'Marco',  lastName:'Silva',    role:'MECH RTG', roleDesc:'Mechanical Rating',                       gender:'m', watch:'A',    dcTeam:null    },
  { id:'brennan',  comp:'engine_room', rating:'AB',  firstName:'Joe',    lastName:'Brennan',  role:'MECH RTG', roleDesc:'Mechanical Rating',                       gender:'m', watch:'A',    dcTeam:null    },
  { id:'hurst',    comp:'engine_room', rating:'LT',  firstName:'Colin',  lastName:'Hurst',    role:'MRWO',     roleDesc:'Manoeuvring Room Watch Officer',          gender:'m', watch:'B',    dcTeam:null    },
  { id:'lamb',     comp:'engine_room', rating:'WO',  firstName:'Dennis', lastName:'Lamb',     role:'WO MECH',  roleDesc:'WO Mechanical on Watch',                  gender:'m', watch:'B',    dcTeam:null    },
  { id:'harper',   comp:'engine_room', rating:'CPO', firstName:'Fred',   lastName:'Harper',   role:'MCHY CPO', roleDesc:'Machinery CPO on Watch',                  gender:'m', watch:'B',    dcTeam:null    },
  { id:'payne',    comp:'engine_room', rating:'PO',  firstName:'David',  lastName:'Payne',    role:'MECH PO',  roleDesc:'Mechanical PO on Watch',                  gender:'m', watch:'B',    dcTeam:null    },
  { id:'saunders', comp:'engine_room', rating:'PO',  firstName:'Ray',    lastName:'Saunders', role:'PROP PO',  roleDesc:'Propulsion PO on Watch',                  gender:'m', watch:'B',    dcTeam:null    },
  { id:'sutton',   comp:'engine_room', rating:'LS',  firstName:'Barry',  lastName:'Sutton',   role:'MECH LS',  roleDesc:'Mechanical Leading Seaman on Watch',       gender:'m', watch:'B',    dcTeam:null    },
  { id:'webb',     comp:'engine_room', rating:'LS',  firstName:'Claire', lastName:'Webb',     role:'MECH LS',  roleDesc:'Mechanical Leading Seaman on Watch',       gender:'f', watch:'B',    dcTeam:null    },
  { id:'barker',   comp:'engine_room', rating:'AB',  firstName:'Tim',    lastName:'Barker',   role:'MECH RTG', roleDesc:'Mechanical Rating',                        gender:'m', watch:'B',    dcTeam:null    },
  { id:'lowe',     comp:'engine_room', rating:'AB',  firstName:'Dan',    lastName:'Lowe',     role:'MECH RTG', roleDesc:'Mechanical Rating',                        gender:'m', watch:'B',    dcTeam:null    },
  // ── AFT ENDS (15) ─────────────────────────────────────────────────────
  { id:'bradley',  comp:'aft_ends', rating:'LT',  firstName:'Owen',   lastName:'Bradley',  role:'E/H OFF',  roleDesc:'Electrical & Hydraulics Officer / DC Bravo OIC', gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'burgess',  comp:'aft_ends', rating:'CPO', firstName:'Dave',   lastName:'Burgess',  role:'AFT CPO',  roleDesc:'Aft Section CPO on Watch',                   gender:'m', watch:'A',    dcTeam:null    },
  { id:'regan',    comp:'aft_ends', rating:'PO',  firstName:'Phil',   lastName:'Regan',    role:'ELEC PO',  roleDesc:'Electrical Systems PO',                      gender:'m', watch:'A',    dcTeam:null    },
  { id:'fox',      comp:'aft_ends', rating:'LS',  firstName:'Darren', lastName:'Fox',      role:'ELEC LS',  roleDesc:'Electrical Leading Seaman on Watch',          gender:'m', watch:'A',    dcTeam:null    },
  { id:'fry',      comp:'aft_ends', rating:'LS',  firstName:'Jason',  lastName:'Fry',      role:'TA OP',    roleDesc:'Towed Array Operator',                        gender:'m', watch:'A',    dcTeam:null    },
  { id:'chambers', comp:'aft_ends', rating:'AB',  firstName:'Russ',   lastName:'Chambers', role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'m', watch:'A',    dcTeam:'bravo' },
  { id:'sharpe',   comp:'aft_ends', rating:'AB',  firstName:'Liam',   lastName:'Sharpe',   role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'m', watch:'A',    dcTeam:null    },
  { id:'hirst',    comp:'aft_ends', rating:'AB',  firstName:'Sam',    lastName:'Hirst',    role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'m', watch:'A',    dcTeam:null    },
  { id:'stone',    comp:'aft_ends', rating:'PO',  firstName:'Harry',  lastName:'Stone',    role:'HYD PO',   roleDesc:'Hydraulics PO on Watch',                     gender:'m', watch:'B',    dcTeam:null    },
  { id:'reilly',   comp:'aft_ends', rating:'LS',  firstName:'Mike',   lastName:'Reilly',   role:'STR/PLN',  roleDesc:'Steering & Planes Leading Seaman',            gender:'m', watch:'B',    dcTeam:null    },
  { id:'turner',   comp:'aft_ends', rating:'AB',  firstName:'Amy',    lastName:'Turner',   role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'f', watch:'B',    dcTeam:null    },
  { id:'dix',      comp:'aft_ends', rating:'AB',  firstName:'Paul',   lastName:'Dix',      role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'m', watch:'B',    dcTeam:null    },
  { id:'lovell',   comp:'aft_ends', rating:'AB',  firstName:'Ben',    lastName:'Lovell',   role:'AFT RTG',  roleDesc:'Aft Section Rating',                         gender:'m', watch:'B',    dcTeam:null    },
  { id:'todd',     comp:'aft_ends', rating:'PO',  firstName:'Graham', lastName:'Todd',     role:'HYD PO',   roleDesc:'Hydraulics PO on Watch',                     gender:'m', watch:'B',    dcTeam:null    },
  { id:'park',     comp:'aft_ends', rating:'LS',  firstName:'Andy',   lastName:'Park',     role:'AFT PLN',  roleDesc:'Aft Planes Operator',                        gender:'m', watch:'B',    dcTeam:null    },
];

// ── Select manifest by nation ───────────────────────────────────────────────
function _activeManifest() {
  const n = nation();
  if (n === 'US') return CREW_MANIFEST_USN;
  if (n === 'DE') return CREW_MANIFEST_DE;
  return CREW_MANIFEST_RN;
}

// Backwards-compatible export for any code that reads CREW_MANIFEST directly.
// Returns the RN manifest (default). Use _activeManifest() internally.
export const CREW_MANIFEST = CREW_MANIFEST_RN;

// Derive organisational department from role or compartment when not explicit.
const _DEPT_BY_ROLE = {
  // RN
  'CO':'command','XO':'command','1ST LT':'command',"COX'N":'command',
  'MEO':'engineering',
  'LMA':'medical','MA':'medical',
  'CPOSA':'supply','PO(CS)':'supply','AB(CS)':'supply',
  // USN
  'DCA':'command','COW':'command',
  'ENG':'engineering',
  'IDC':'medical','HM':'medical',
  'CSMC':'supply','CS':'supply',
  // DE
  'KDT':'command','IWO':'command','OSTM':'command',
  'LI':'engineering',
  'SANM':'medical',
  'VMAT':'supply',
};
const _DEPT_BY_COMP = {
  fore_ends:'weapons', control_room:'warfare', aux_section:'warfare',
  reactor_comp:'reactor', engine_room:'engineering', aft_ends:'engineering',
};

export function buildCrewManifest(){
  const manifest={};
  for(const comp of COMPS) manifest[comp]=[];
  const INITIAL_WATCH='A';
  const restComp=COMPS.includes('aux_section')?'aux_section':COMPS[0];
  const activeManifest = _activeManifest();
  for(const m of activeManifest){
    const dept=m.dept||_DEPT_BY_ROLE[m.role]||_DEPT_BY_COMP[m.comp]||'warfare';
    // Map crew station comp to active layout
    const _LEGACY_MAP={
      fore_ends:'forward', control_room:'forward', aux_section:'forward',
      reactor_comp:'reactor', engine_room:'engineering', aft_ends:'engineering',
    };
    // Dynamic override: if COMPS has 'midships'/'aft' (Type 209), remap legacy keys
    if(COMPS.includes('midships')){
      _LEGACY_MAP.control_room='midships';
      _LEGACY_MAP.aux_section='midships';
      _LEGACY_MAP.fore_ends='forward';
      _LEGACY_MAP.engine_room='aft';
      _LEGACY_MAP.aft_ends='aft';
      _LEGACY_MAP.reactor_comp='aft';
    }
    const mappedComp=COMPS.includes(m.comp)?m.comp:(_LEGACY_MAP[m.comp]&&COMPS.includes(_LEGACY_MAP[m.comp]))?_LEGACY_MAP[m.comp]:COMPS[0];
    const stationComp=mappedComp;
    const physComp=(m.watch!=='duty'&&m.watch!==INITIAL_WATCH&&dept!=='supply'&&dept!=='medical')
                   ? restComp : stationComp;
    manifest[physComp].push({
      id:          m.id,
      name:        `${m.rating} ${m.firstName[0]}.${m.lastName}`,
      firstName:   m.firstName,
      lastName:    m.lastName,
      rating:      m.rating,
      role:        m.role,
      roleDesc:    m.roleDesc,
      gender:      m.gender,
      watch:       m.watch,
      dcTeam:      m.dcTeam,
      dept,
      status:      'fit',
      comp:        physComp,
      stationComp: stationComp,
    });
  }
  return manifest;
}

// Move crew to their watch station or rest location (messes) on watch change.
export function relocateCrewForWatch(d, activeWatch){
  const allCrew=COMPS.flatMap(comp=>d.crew[comp]);
  for(const comp of COMPS) d.crew[comp]=[];
  for(const cr of allCrew){
    if(cr.displaced){ d.crew[cr.comp].push(cr); continue; }
    const goStation=cr.watch===activeWatch||cr.watch==='duty'||cr.dept==='supply'||cr.dept==='medical';
    const restComp2=COMPS.includes('aux_section')?'aux_section':COMPS[0];
    const dest=goStation ? (cr.stationComp||cr.comp) : restComp2;
    d.crew[dest].push(cr);
    cr.comp=dest;
  }
}

// ── Crew helpers ──────────────────────────────────────────────────────────
export function totalFit(){
  if(!player.damage) return 0;
  return COMPS.reduce((a,c)=>a+(player.damage.crew[c]||[]).filter(x=>x.status==='fit').length,0);
}
export function totalWounded(){
  if(!player.damage) return 0;
  return COMPS.reduce((a,c)=>a+(player.damage.crew[c]||[]).filter(x=>x.status==='wounded').length,0);
}
export function totalKilled(){
  if(!player.damage) return 0;
  return COMPS.reduce((a,c)=>a+(player.damage.crew[c]||[]).filter(x=>x.status==='killed').length,0);
}
export function totalCrew(){ return player.damage?.crewTotal||90; }

export function crewEfficiency(dept){
  const fit=totalFit(),total=totalCrew();
  if(total===0) return 0;
  return clamp(fit/total,0,1.0);
}
export function maxDCTeams(){
  return Object.values(player.damage?.teams||{}).filter(t=>t.state!=='lost').length;
}
