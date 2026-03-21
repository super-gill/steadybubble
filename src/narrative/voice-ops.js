'use strict';

import { log, qlog, msg, P, dcLog } from './comms.js';
import { T } from './terminology.js';

// ════════════════════════════════════════════════════════════════════════
// NAVIGATION / HELM / MANOEUVRING
// ════════════════════════════════════════════════════════════════════════
export const nav = {
  courseChange(crsStr) {
    log(T('stConn'), `${T('connHelm')} — come to course ${crsStr}`);
    qlog(T('stHelm'), `${T('helmConn')} — ${T('aye')}, coming to course ${crsStr}`, 1.5);
  },
  tdcDesignated(trackId, hasSonar) {
    msg(`TDC: ${trackId} DESIGNATED`, 1.0);
    log(T('stConn'), `${T('connWeps')} — TDC, designate track ${trackId}`);
    if (hasSonar) log(T('stSonar'), `${T('connSonar')} — track ${trackId} locked in TDC`);
  },
  silentRunning(on) {
    if (on) {
      log(T('stConn'),  `${T('allConn')} — ${T('silentRunning')}. Silent routine`, P.MED);
      qlog(T('stHelm'),  `${T('helmConn')} — ${T('aye')}. Reducing to slow ahead`, 1.0);
      qlog(T('stEng'),   `${T('engConn')} — ${T('aye')}. Securing non-essential machinery. MSC to low speed.`, 1.8);
      qlog(T('stManv'),  `${T('connManv')} — propulsion reducing, answering slow ahead`, 3.0);
      qlog(T('stEng'),   `${T('engConn')} — ventilation secured. HP air isolated. All fans stopped`, 4.2);
      qlog(T('stComms'), `${T('helmConn').replace('Helm', T('stComms'))} — radio room going receive only. No transmissions`, 5.0);
      qlog(T('stSonar'), `${T('connSonar')} — sound room ${T('aye')}. Passive suite only, active sonar safed. Listening watch maintained`, 6.0);
      qlog(T('stWeps'),  `${T('wepsConn')} — weapon systems to standby. Tube space quiet`, 7.5);
      qlog(T('stNav'),   `${T('helmConn').replace('Helm', T('stNav'))} — navigation on low power. DR plot maintained`, 8.5);
      qlog(T('stEng'),   `${T('engConn')} — ship is rigged for ${T('silentRunning').replace('rig for ', '')}. Duty watch closed up`, 10.5);
    } else {
      log(T('stConn'),  `${T('allConn')} — secure from ${T('silentRunning').replace('rig for ', '')}. Resume normal operations`, P.MED);
      qlog(T('stEng'),   `${T('engConn')} — ${T('aye')}. Restoring ventilation and circulation`, 1.2);
      qlog(T('stManv'),  `${T('connManv')} — answering half ahead`, 2.2);
      qlog(T('stComms'), `${T('helmConn').replace('Helm', T('stComms'))} — radio room returning to normal watch`, 2.8);
      qlog(T('stSonar'), `${T('connSonar')} — full suite restored`, 3.5);
      qlog(T('stEng'),   `${T('engConn')} — secured from ${T('silentRunning').replace('rig for ', '')}. All systems normal`, 4.8);
    }
    msg(on ? T('silentRunningU') : T('normalRun'), 1.0);
  },
  emergencyTurn() {
    msg('EMERGENCY TURN!', 1.2);
    log(T('stConn'), `${T('connHelm')} — hard over, emergency turn. Full ahead.`, P.MED);
    qlog(T('stHelm'), `${T('helmConn')} — hard over ${T('aye')}, full rudder applied`, 0.6);
    qlog(T('stConn'), `${T('connHelm')} — watch your depth on that angle`, 1.8);
    qlog(T('stHelm'), `${T('helmConn')} — rate of turn building`, 2.5);
  },
  crashDive() {
    msg(T('crashDive'), 2.0);
    log(T('stConn'), `${T('connHelm')} — emergency deep, full ahead`, P.MED);
    qlog(T('stEng'), `${T('engConn')} — flooding all tanks, full dive planes, max down angle`, 0.8);
    qlog(T('stEng'), `${T('engConn')} — steep down angle, rate of descent high`, 2.0);
  },
  emergencyBlow() {
    msg(T('emergencyBlow'), 1.2);
    log(T('stConn'), T('emergencyBlowCmd'), P.MED);
    qlog(T('stEng'), `${T('engConn')} — emergency blow, main ballast tanks venting`, 0.5);
    qlog(T('stEng'), `${T('engConn')} — blow complete, rising fast`, 2.5);
  },
  depthOrder(ordStr, direction) {
    msg(`ORDERED ${ordStr}`, 0.8);
    if (direction === 'down') {
      log(T('stConn'), `${T('connHelm')} — make your depth ${ordStr}`);
      qlog(T('stHelm'), `${T('helmConn')} — ${T('aye')}, making my depth ${ordStr}`, 1.0);
    } else {
      log(T('stConn'), `${T('connHelm')} — come up to ${ordStr}`);
      qlog(T('stHelm'), `${T('helmConn')} — ${T('aye')}, coming up to ${ordStr}`, 1.0);
    }
  },
  depthOrderRelay(ordStr, direction) {
    msg(`ORDERED ${ordStr}`, 0.8);
    if (direction === 'down') {
      log(T('stCO'), `${T('manvConn')}, ${T('co')} — relay to ${T('stHelm')}: make depth ${ordStr}. Manual ballast ops`, P.MED);
      qlog(T('stEng'),  `${T('co')}, ${T('maneuvering')} — ${T('aye')}, relaying to ${T('stHelm')}`, 2.0);
      qlog(T('stHelm'), `${T('maneuvering')}, ${T('stHelm')} — making depth ${ordStr}. Operating ballast manually`, 4.5);
    } else {
      log(T('stCO'), `${T('manvConn')}, ${T('co')} — relay to ${T('stHelm')}: come up to ${ordStr}. Manual ballast ops`, P.MED);
      qlog(T('stEng'),  `${T('co')}, ${T('maneuvering')} — ${T('aye')}, relaying to ${T('stHelm')}`, 2.0);
      qlog(T('stHelm'), `${T('maneuvering')}, ${T('stHelm')} — coming up to ${ordStr}. Operating ballast manually`, 4.5);
    }
  },
  connRoomUnavail(action) {
    const label = action.charAt(0).toUpperCase() + action.slice(1);
    msg(`${action.toUpperCase()}: CONN EVACUATED`, 1.2);
    log(T('stCO'), `${label} unavailable — ${T('controlRoom')} evacuated`, P.MED);
  },
  ballastDamageWarning(state) {
    const severity = state==='destroyed' ? 'destroyed' : state==='offline' ? 'offline' : 'degraded';
    qlog(T('stEng'), `${T('engConn')} — ballast system ${severity}, depth recovery will be impaired`, 3.0);
  },
  comeToPD() {
    msg('COME TO PD', 1.0);
    log(T('stConn'), `${T('connHelm')} — come to periscope depth`);
    qlog(T('stHelm'), `${T('helmConn')} — ${T('aye')}, coming to periscope depth`, 1.0);
  },
  speedReport(speed)  { qlog(T('stHelm'), `${T('helmConn')} — making ${Math.round(speed)} knots`, 0.5); },
  allStop()           { qlog(T('stHelm'), `${T('helmConn')} — stop both, speed zero`, 0.5); },
  waypointReached(crsNext)  { log(T('stHelm'), `${T('helmConn')} — waypoint reached, coming to course ${crsNext}`); },
  finalWaypoint(hdgStr)     { log(T('stHelm'), `${T('helmConn')} — final waypoint reached, steady on course ${hdgStr}`); },
  grounded()          { msg('GROUNDED', 1.0); },
  crushDepth(depth) {
    log(T('stEng'), `${T('engConn')} — hull stress. Depth ${Math.round(depth)}m exceeds crush limit`, P.CRIT);
    msg('CRUSH DEPTH EXCEEDED', 1.5);
  },
  depthReport(band)   { log(T('stHelm'), `${T('helmConn')} — passing ${band} metres`); },
  cavitation(on) {
    if (on) log(T('stEng'), `${T('engConn')} — cavitating. Noise signature elevated`, P.MED);
    else    log(T('stEng'), `${T('engConn')} — cavitation clear`);
  },
  towedArrayStress(cause, newState) {
    if (newState === 'damaged') log(T('stEng'), `${T('engConn')} — array took stress on that ${cause}, degraded`, P.MED);
    else                        log(T('stEng'), `${T('engConn')} — array cable parted on that ${cause}. Array lost`, P.MED);
  },
  towedArrayOverspeed(speed) {
    log(T('stEng'), `${T('engConn')} — array overspeed. Rated 18kt, currently ${Math.round(speed)}kt. Risk of cable loss`, P.MED);
  },
  steeringCasualty(state) {
    if (state === 'degraded') {
      msg('STEERING DEGRADED', 1.2);
      log(T('stEng'), `${T('connManv')} — steering casualty, rudder response degraded. Reduced authority`, P.MED);
      qlog(T('stHelm'), `${T('maneuvering')}, ${T('stHelm')} — steering degraded, maintaining course best able`, 2.0);
    } else if (state === 'offline') {
      msg('STEERING OFFLINE', 1.4);
      log(T('stEng'), `${T('connManv')} — steering offline. Switching to emergency tiller. Severely reduced authority`, P.CRIT);
      qlog(T('stHelm'), `${T('maneuvering')}, ${T('stHelm')} — emergency tiller rigged. Turns very slow`, 2.5);
    } else if (state === 'destroyed') {
      msg('RUDDER JAMMED', 1.6);
      log(T('stEng'), `${T('connManv')} — rudder jammed. No steering authority. Recommend all stop`, P.CRIT);
      qlog(T('stHelm'), `${T('maneuvering')}, ${T('stHelm')} — no steering response. Rudder jammed`, 2.0);
    }
  },
};

// ════════════════════════════════════════════════════════════════════════
// SENSORS / SONAR / TOWED ARRAY
// ════════════════════════════════════════════════════════════════════════
export const sensors = {
  newContact(id, typeLabel, brgStr) {
    log(T('stSonar'), `${T('connSonar')} — possible contact, investigating`);
    qlog(T('stSonar'), `${T('connSonar')} — new ${typeLabel}, track ${id}, bears ${brgStr}, passive`, 2.5);
    qlog(T('stConn'),  `${T('sonarConn')} — ${T('aye')}, track ${id}. Maintain track`, 4.0);
  },
  newContactTowed(id, typeLabel, brgStr) {
    log(T('stSonar'), `${T('connSonar')} — possible contact, towed array, investigating`);
    qlog(T('stSonar'), `${T('connSonar')} — new ${typeLabel}, track ${id}, bears ${brgStr}, towed array, ambiguous`, 2.5);
    qlog(T('stSonar'), `${T('connSonar')} — ${id} port/starboard ambiguous. Recommend 10-20° course change to resolve`, 3.5);
    qlog(T('stConn'),  `${T('sonarConn')} — ${T('aye')}, track ${id}. Maintain track`, 5.0);
  },
  contactLabel(label) { if (label) log(T('stSonar'), label); },
  tmaDegrading(id) {
    log(T('stSonar'), `${T('connSonar')} — ${id} solution degrading, towed ambiguity unresolved. Recommend 20° course change`, P.MED);
  },
  ambiguityResolved(id, sideStr) {
    log(T('stSonar'), `${T('connSonar')} — ${id} ambiguity resolved, contact is ${sideStr}`);
    qlog(T('stConn'), `${T('sonarConn')} — ${T('aye')}, ${id} resolved`, 1.0);
  },
  tmaDegraded(id) {
    log(T('stSonar'), `${T('connSonar')} — ${id}, TMA degraded, solution building`);
    qlog(T('stConn'), `${T('connWeps')} — TDC, update solution on ${id}`, 1.5);
  },
  tmaSolid(id) {
    log(T('stSonar'), `${T('connSonar')} — ${id}, TMA solution solid. Ready to fire.`, P.MED);
    qlog(T('stConn'), `${T('connWeps')} — weapons free on ${id}. Stand by to fire.`, 2.0);
  },
  classified(id, type) {
    log(T('stSonar'), `${T('connSonar')} — ${id}, classify ${type}`, P.MED);
  },
  launchTransient(brgStr) {
    log(T('stSonar'), `${T('connSonar')} — launch transient, bears ${brgStr}. Torpedo in the water`, P.CRIT);
  },
  activePing(hits) {
    log(T('stSonar'), hits > 0
      ? `${T('connSonar')} — active ping, ${hits} return${hits > 1 ? 's' : ''}`
      : `${T('connSonar')} — active ping, no returns`);
  },
  pingDatum(alerted) {
    if (alerted > 0) log(T('stSonar'), `${T('connSonar')} — ping datum. ${alerted} contact${alerted > 1 ? 's' : ''} alerted to our position`, P.MED);
  },
  arrayDeployHalfway() { log(T('stEng'), `${T('engConn')} — array halfway out, no issues`); },
  arrayStreamed() {
    log(T('stEng'), `${T('engConn')} — array fully streamed`);
    qlog(T('stSonar'), `${T('connSonar')} — towed array online, long-range passive active`, 1.0);
    qlog(T('stSonar'), `${T('connSonar')} — note bearing ambiguity on towed contacts. Recommend 10-20° course change to resolve`, 2.0);
  },
  arrayInboard()                { log(T('stEng'), `${T('engConn')} — array inboard and stowed`); },
  arrayDamagedMsg(m)            { log(T('stEng'), m, P.MED); },
  arrayOverspeed(speed)         { log(T('stEng'), `${T('engConn')} — array overspeed, ${Math.round(speed)}kt. Risk of cable loss`, P.MED); },
  arrayCannotDeploy()           { log(T('stEng'), `${T('engConn')} — array destroyed, cannot deploy`, P.MED); },
  arrayDeploySpeedLimit(speed)  { qlog(T('stEng'), `${T('engConn')} — unable. Speed ${Math.round(speed)}kt, array rated 12kt for deployment. Reduce speed`, 0.5); },
  arrayDeploy() {
    log(T('stConn'), `${T('connEng')} — deploy towed array`);
    qlog(T('stEng'), `${T('engConn')} — ${T('aye')}, deploying array. Thirty seconds to operational`, 1.0);
  },
  arrayRetract() {
    log(T('stConn'), `${T('connEng')} — retract towed array`);
    qlog(T('stEng'), `${T('engConn')} — ${T('aye')}, hauling in. Twenty seconds`, 1.0);
  },
};

// ════════════════════════════════════════════════════════════════════════
// TACTICAL / CONTACT MANAGEMENT
// ════════════════════════════════════════════════════════════════════════
export const tactical = {
  battleStations(scenario) {
    const lines = {
      single:  [[T('stConn'),  `${T('connAll').split(' —')[0]}, ${T('aye')} — single adversary contact. ${T('actionStations')}`,       P.MED]],
      barrier: [[T('stSonar'), `${T('connSonar')} — multiple contacts, all bearings, close range`,  P.MED],
                [T('stConn'),  `${T('connAll')} — ${T('actionStations').toLowerCase()}. Prepare to evade and engage.`, P.MED]],
      patrol:  [[T('stSonar'), `${T('connSonar')} — four-contact barrier, spread across track`,     P.MED],
                [T('stConn'),  `${T('connHelm')} — slow ahead. Ultra-quiet routine.`,       P.MED]],
      ssbn_hunt:[[T('stConn'),  `${T('connAll').split(' —')[0]} — intelligence brief: Typhoon-class SSBN on bastion patrol, one escort SSN screening.`, P.MED],
                 [T('stWeps'),  `${T('wepsConn')} — weapons free on both contacts. Primary target is the boomer.`, P.MED],
                 [T('stConn'),  `${T('connHelm')} — slow ahead, ${T('silentRunning').replace('rig for ', '')}. Find the boomer.`, P.MED]],
      boss_fight:[[T('stConn'), `${T('connAll').split(' —')[0]} — flash traffic from SUBLANT. New hostile submarine class confirmed at sea. Designate: Zeta.`, P.CRIT],
                  [T('stConn'), `${T('connAll').split(' —')[0]} — intelligence reports Zeta-class is extremely quiet, highly capable. Expect a hard fight.`, P.MED],
                  [T('stWeps'), `${T('wepsConn')} — weapons free. This one won't go down easy — make every shot count.`, P.MED]],
      asw_taskforce:[[T('stSonar'), `${T('connSonar')} — multiple surface contacts, active sonar transmissions. Classify ASW taskforce.`, P.MED],
                     [T('stConn'), `${T('connAll').split(' —')[0]} — surface group is prosecuting our datum. ${T('silentRunning')}, take her deep.`, P.MED],
                     [T('stWeps'), `${T('wepsConn')} — weapons free on all surface contacts. Use the layer — they'll be pinging hard.`, P.MED]],
    };
    if (lines[scenario]) lines[scenario].forEach(([s, m, p]) => log(s, m, p||P.NORMAL));
  },
  contact(brgStr) {
    log(T('stSonar'), `${T('connSonar')} — one contact, bears ${brgStr}, classify submerged`);
  },
  waveReport(waveLabel, count, groupBrgStr) {
    log(T('stConn'),  waveLabel, P.MED);
    log(T('stSonar'), `${T('connSonar')} — ${count} contact${count > 1 ? 's' : ''}, group bears ${groupBrgStr}`);
  },
  prosecuting() {
    log(T('stSonar'), `${T('connSonar')} — contacts manoeuvring aggressively, classify prosecuting`, P.MED);
    qlog(T('stConn'), `${T('connAll')} — ${T('actionStations3x')}: Assume defence watches.`, 1.5, P.MED);
    qlog(T('stWeps'), `${T('wepsConn')} — tubes one and two ready in all respects. Standing by.`, 3.0);
  },
  contactLost()  { log(T('stSonar'), `${T('connSonar')} — group has lost contact. Reverting to patrol`); },
  areaClear(waveNum) {
    log(T('stSonar'), `${T('connSonar')} — no further contacts. Area appears clear`);
    qlog(T('stConn'), `${T('sonarConn')} — ${T('aye')}. ${T('allConn')}, stand easy`, 2.0);
    qlog(T('stConn'), `Wave ${waveNum} neutralised. Maintain watch`, 4.0);
  },
  enemyTorpedo(brgStr) {
    log(T('stSonar'), `${T('connSonar')} — torpedo in the water, bears ${brgStr}`, P.CRIT);
  },
  buoySplash(brgStr) {
    log(T('stSonar'), `${T('connSonar')} — splash transient, bears ${brgStr}. Sonobuoy in the water`);
  },
  heloContact(brgStr) {
    log(T('stSonar'), `${T('connSonar')} — rotary wing contact, bears ${brgStr}. Classify helicopter, ASW`);
  },
  dipSonar(brgStr) {
    log(T('stSonar'), `${T('connSonar')} — dipping sonar active, bears ${brgStr}`, P.MED);
  },
  heloDrop(brgStr) {
    log(T('stSonar'), `${T('connSonar')} — torpedo in the water, bears ${brgStr}. Helo drop, classify ASW.`, P.CRIT);
    msg('TORPEDO IN THE WATER', 3.0);
  },
  dcDetonation(brgStr) {
    log(T('stSonar'), `${T('connSonar')} — depth charge detonation, bears ${brgStr}.`, P.MED);
  },
  asrocLaunch() {
    log(T('stSonar'), `${T('connSonar')} — rocket launch transient, surface contact. ASROC inbound.`, P.CRIT);
    msg('ASROC INBOUND', 3.0);
  },
};

// ════════════════════════════════════════════════════════════════════════
// DEPTH WARNINGS — state-aware
// ════════════════════════════════════════════════════════════════════════
export const depth = {
  divingLimit(depthM, tacticalState) {
    if (tacticalState === 'action') {
      log(T('stEng'), `${T('engConn')} — passing diving limit. ${Math.round(depthM)}m.`, P.MED);
    } else {
      log(T('stHelm'), `${T('helmConn')} — approaching diving limit. Depth ${Math.round(depthM)}m. Diving limit is 400m.`, P.MED);
      qlog(T('stConn'), `${T('connHelm')} — ${T('aye')}. Reduce rate of descent. Watch your depth.`, 1.0, P.MED);
    }
    msg(`DIVING LIMIT — ${Math.round(depthM)}m`, 2.0);
  },
  designDepth(depthM) {
    log(T('stEng'), `${T('engConn')} — hull stress audible. Depth ${Math.round(depthM)}m. Exceeding design depth.`, P.CRIT);
    msg(`DESIGN DEPTH EXCEEDED — ${Math.round(depthM)}m`, 2.5);
  },
  crush(depthM) {
    log(T('stConn'), `${T('connAll').split(' —')[0]} — crush depth exceeded at ${depthM}m. Hull failure.`, P.CRIT);
    msg('HULL FAILURE', 5.0);
  },
  collapseImminentWarning(depthM) {
    log(T('stEng'), `${T('engConn')} — structural failure imminent. Depth ${Math.round(depthM)}m. She will not hold.`, P.CRIT);
    msg(`COLLAPSE DEPTH — ${Math.round(depthM)}m`, 3.0);
  },
  hullDamageCreaking(depthM) {
    log(T('stEng'), `${T('engConn')} — hull working hard at ${Math.round(depthM)}m. Structural damage is audible — creaking and stress pops heard throughout the boat. Recommend reducing depth.`, P.CRIT);
    qlog(T('stConn'), `${T('connAll').split(' —')[0]} — understood. Watch your depth, watch your depth.`, 1.4, P.CRIT);
    msg(`HULL STRESS — ${Math.round(depthM)}m`, 2.5);
  },
};

// ════════════════════════════════════════════════════════════════════════
// TRIM / BUOYANCY / HPA
// ════════════════════════════════════════════════════════════════════════
export const trim = {
  planesDemanded(pct) {
    log(T('stHelm'), `${T('helmConn')} — planes working hard. ${pct}% authority remaining. Flooding affecting trim.`, P.MED);
  },
  planesOverwhelmed(speedKt) {
    log(T('stHelm'), `${T('helmConn')} — unable to hold ordered depth on planes. Insufficient authority at ${speedKt}kt.`, P.CRIT);
    qlog(T('stConn'), `${T('connHelm')} — increase speed. We need planes to hold trim.`, 1.0, P.CRIT);
  },
  ballastStrained(pct) {
    log(T('stEng'), `${T('engConn')} — ballast compensating for flooding. System at ${pct}% capacity. Monitoring.`, P.MED);
  },
  ballastLimit() {
    log(T('stEng'), `${T('engConn')} — ballast tanks at limit. Unable to compensate further. Boat will sink if flooding continues.`, P.CRIT);
    msg('BALLAST LIMIT', 2.5);
  },
  ballastOverwhelmed() {
    log(T('stEng'), `${T('engConn')} — flooding exceeds ballast capacity. Boat is sinking.`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — blow ballast. Emergency surface.`, 0.8, P.CRIT);
    msg('BALLAST OVERWHELMED', 3.0);
  },
  blowAlreadyActive() {
    log(T('stEng'), `${T('engConn')} — emergency blow already in progress.`, P.MED);
  },
  blowSystemFailed(sysState) {
    const why = sysState === 'degraded'
      ? 'Ballast control degraded. Main blow may not respond.'
      : 'Ballast control offline. Main blow system unserviceable.';
    qlog(T('stHelm'), `${T('helmConn')} — no response on blow controls. ${why}`, 3.5, P.CRIT);
    qlog(T('stConn'), `DC, ${T('connAll').split(' —')[0]} — main blow system has failed. Shut main vents in hand control. Open HPA manually.`, 5.0, P.CRIT);
    msg('BLOW SYSTEM FAILED', 5.0);
  },
  blowNoResponse() {
    log(T('stHelm'), `${T('helmConn')} — no response on blow. Confirming system failure.`, P.CRIT);
  },
  blowManualVentsShut() {
    qlog(T('stDC'), `${T('connAll').split(' —')[0]}, DC — main vents shut in hand control. Standing by to open HPA.`, 0, P.MED);
  },
  blowManualHPAOpen(ambientBar, groupBar) {
    log(T('stDC'), `${T('connAll').split(' —')[0]}, DC — HPA open in hand control. Main ballast venting. Ambient ${ambientBar} bar, group pressure ${groupBar} bar.`, P.CRIT);
    msg('MANUAL BLOW — VENTING', 2.0);
  },
  blowOpened(ambientBar, groupBar) {
    log(T('stConn'), `${T('connAll')} — ${T('emergencyStations3x')}: ${T('emergencyBlowCmd')}. Prepare to surface the boat.`, P.CRIT);
    msg(T('emergencyStations'), 2.5);
    qlog(T('stConn'), `${T('connAll').split(' —')[0]} — full ahead both. Full rise on the planes. Prepare to surface the boat.`, 1.5, P.CRIT);
    qlog(T('stHelm'), `${T('helmConn')} — full ahead, full rise on the planes. ${T('aye')}.`, 2.8, P.MED);
    qlog(T('stConn'), `DC, ${T('connAll').split(' —')[0]} — prepare to operate main vents in hand control. Blow main ballast.`, 4.0, P.CRIT);
    qlog(T('stEng'),  `${T('engConn')} — emergency blow open. Main ballast venting. Ambient ${ambientBar} bar, group pressure ${groupBar} bar.`, 5.5, P.CRIT);
    msg(`${T('emergencyBlow')} — VENTING`, 5.5);
  },
  blowOrderedManual() {
    log(T('stConn'), `${T('connAll')} — ${T('emergencyStations3x')}: ${T('emergencyBlowCmd')}. Prepare to surface the boat.`, P.CRIT);
    msg(T('emergencyStations'), 2.5);
    qlog(T('stConn'), `${T('connAll').split(' —')[0]} — full ahead both. Full rise on the planes.`, 1.5, P.CRIT);
    qlog(T('stHelm'), `${T('helmConn')} — full ahead, full rise. ${T('aye')}. Attempting blow.`, 2.8, P.MED);
  },
  blowProgress(depthM, differential) {
    if(differential > 20){
      log(T('stEng'), `${T('engConn')} — blow continuing. Depth ${depthM}m, pressure differential ${differential} bar. Rising.`, P.MED);
    } else if(differential > 5){
      log(T('stEng'), `${T('engConn')} — blow weakening. Depth ${depthM}m, differential ${differential} bar. Climb rate reducing.`, P.CRIT);
    } else {
      log(T('stEng'), `${T('engConn')} — blow near exhausted. Depth ${depthM}m, differential ${differential} bar. Minimal climb rate.`, P.CRIT);
      msg('BLOW WEAKENING', 2.0);
    }
  },
  blowTanksClear(depthM) {
    log(T('stEng'), `${T('engConn')} — main ballast clear. Blow valves shut. Boat is positively buoyant at ${depthM}m. Rising on residual buoyancy.`, P.MED);
    msg('BALLAST CLEAR — RISING', 2.0);
  },
  blowOverwhelmed(depthM) {
    log(T('stEng'), `${T('engConn')} — main ballast clear but flooding mass too great. Boat is negatively buoyant at ${depthM}m. Still sinking.`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — blown tanks cannot overcome flooding. DC priority: reduce flood load or prepare to abandon.`, 2.0, P.CRIT);
    msg('BLOW INSUFFICIENT — SINKING', 3.0);
  },
  blowExhausted(depthM) {
    log(T('stEng'),  `${T('engConn')} — HP air equalised with ambient. Securing emergency blow. Depth ${depthM}m. No further blow available without surface recharge.`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — secured from emergency blow. Boat at ${depthM}m. HP air exhausted.`, 1.0, P.CRIT);
    msg('SECURED — BLOW EXHAUSTED', 3.0);
  },
  surfaceRechargeStarted(currentBar) {
    log(T('stEng'), `${T('engConn')} — HP air banks charging from atmosphere. Group pressure ${currentBar} bar. Recharge in progress.`, P.MED);
    msg('HP AIR CHARGING', 1.5);
  },
  blowCancelledByOrder(depthM) {
    log(T('stEng'), `${T('engConn')} — blow valves closed. Securing emergency blow.`, P.MED);
    qlog(T('stConn'), `${T('connEng')} ${T('aye')} — blow secured. Make your depth ${depthM} metres.`, P.MED, 1.5);
    msg('BLOW SECURED', 1.5);
  },
  blowSurfaced() {
    log(T('stEng'), `${T('engConn')} — blow valves closed. Securing emergency blow. Boat is surfaced.`, P.MED);
    qlog(T('stConn'), `${T('allConn')} — secured from emergency blow. Surfaced.`, 0.8, P.MED);
    msg('SECURED — SURFACED', 2.0);
  },
  blowFailNoHPA() {
    log(T('stEng'), `${T('engConn')} — unable to blow. HP air pressure below ambient. Cannot displace water.`, P.CRIT);
    msg('BLOW FAILED — NO PRESSURE', 2.5);
  },
  reserveHPACommitted() {
    log(T('stEng'), `${T('engConn')} — reserve HP air committed to blow. This is our last air.`, P.CRIT);
    msg('RESERVE HPA — COMMITTED', 2.0);
  },
  hpaLow(pct) {
    if(pct < 8){
      log(T('stEng'), `${T('engConn')} — HP air critical. ${pct}% remaining. Ballast authority degrading.`, P.CRIT);
      msg('HP AIR CRITICAL', 2.0);
    } else {
      log(T('stEng'), `${T('engConn')} — HP air low. ${pct}% remaining. Recommend recharge.`, P.MED);
    }
  },
  rechargeToggle(on) {
    if(on){
      log(T('stEng'), `${T('engConn')} — HP compressors running. Active recharge commenced. We are louder.`, P.MED);
      msg('HP RECHARGE — ACTIVE', 1.2);
    } else {
      log(T('stEng'), `${T('engConn')} — HP compressors secured. Passive recharge only.`, P.MED);
      msg('HP RECHARGE — SECURED', 1.2);
    }
  },
};

// ════════════════════════════════════════════════════════════════════════
// FIRE
// ════════════════════════════════════════════════════════════════════════
export const fire = {
  ignited(compLabel, station) {
    msg(`FIRE — ${compLabel}`, 1.5);
    log(station, `${T('connSonar').split(',')[0]}, ${station} — FIRE in ${compLabel}. Evacuating non-essential crew`, P.CRIT);
    qlog(T('stConn'), `${station}, ${T('connAll').split(' —')[0]} — ${T('aye')}. DC teams, fire in ${compLabel}. Emergency stations`, 2.0, P.CRIT);
  },
  fireAlarm(roomLabel, station) {
    msg(`FIRE ALARM — ${roomLabel}`, 1.5);
    log(T('stConn'), `${T('allConn')} — fire detection alarm ${roomLabel}. Investigate and report`, P.CRIT);
    qlog(station, `${T('connSonar').split(',')[0]}, ${station} — ${T('aye')}. En route to investigate`, 2.5, P.MED);
  },
  fireInvestigated(roomLabel, station) {
    log(station, `${T('connSonar').split(',')[0]}, ${station} — fire confirmed in ${roomLabel}. Request emergency stations`, P.CRIT);
    qlog(T('stConn'), `${station}, ${T('connAll').split(' —')[0]} — ${T('aye')}. DC teams, fire in ${roomLabel}. Emergency stations`, 2.0, P.CRIT);
  },
  falseAlarm(roomLabel, station) {
    log(station, `${T('connSonar').split(',')[0]}, ${station} — investigated ${roomLabel}, no fire. False alarm`, P.MED);
    qlog(T('stConn'), `${station}, ${T('connAll').split(' —')[0]} — ${T('aye')}. False alarm. Secure from investigation`, 2.0, P.LOW);
  },
  watchkeeperResponse(compLabel, count) {
    const countStr = count === 1 ? 'one watchkeeper' : `${count} watchkeepers`;
    qlog(T('stEng'), `${T('connAll').split(' —')[0]}, ${compLabel} — ${countStr} staying to fight fire`, 1.5, P.MED);
  },
  watchkeeperCasualty(name, compLabel, status) {
    msg('FIRE CASUALTY', 1.2);
    log(T('stEng'), `${T('connAll').split(' —')[0]}, ${compLabel} — watchkeeper ${status}: ${name}`, P.CRIT);
  },
  watchkeeperOvercome(compLabel) {
    msg('WATCHKEEPERS OVERCOME', 1.4);
    log(T('stEng'), `${T('connAll').split(' —')[0]}, ${compLabel} — all watchkeepers overcome. Fire unattended`, P.CRIT);
  },
  dcArrival(teamLabel, compLabel) {
    log(T('stEng'), `${T('connAll').split(' —')[0]}, ${teamLabel} — on scene ${compLabel}, engaging fire`, P.MED);
  },
  dcRelief(compLabel) {
    log(T('stEng'), `${T('connAll').split(' —')[0]}, DC — relieving watchkeepers in ${compLabel}. Taking over fire fight`, P.MED);
  },
  dcStatus(teamLabel, pct, compLabel) {
    dcLog(`${teamLabel} — FIRE ${compLabel} at ${pct}%`);
  },
  outOfControl(compLabel) {
    msg('FIRE OUT OF CONTROL', 1.4);
    log(T('stEng'), `${T('connAll').split(' —')[0]}, ${compLabel} — fire out of control, cannot suppress`, P.CRIT);
  },
  heatDamage(sysLabel, state, compLabel) {
    log(T('stEng'), `${T('connAll').split(' —')[0]}, ${compLabel} — heat damage: ${sysLabel} ${state.toUpperCase()}`, P.MED);
  },
  extinguished(compLabel, by) {
    msg(`FIRE OUT — ${compLabel}`, 1.2);
    if (by === 'watch') {
      log(T('stEng'), `${T('connAll').split(' —')[0]}, ${compLabel} — fire out. Watchkeepers secured the compartment`, P.MED);
    } else {
      log(T('stEng'), `${T('connAll').split(' —')[0]}, DC — fire out in ${compLabel}. Compartment secure`, P.MED);
    }
  },
  drenchInitiated(compLabel) {
    msg(`N2 DRENCH — 20s — ${compLabel}`, 1.6);
    log(T('stEng'), `${T('connAll').split(' —')[0]}, DC — fire out of control in ${compLabel}. Evacuating, nitrogen drench in 20 seconds`, P.CRIT);
  },
  nitrogenDrench(compLabel, cas) {
    msg(`N2 DRENCH — ${compLabel}`, 1.6);
    log(T('stEng'), `${compLabel} — N2 drench complete. Fire out. Compartment uninhabitable — DC team venting`, P.CRIT);
    if (cas > 0) qlog(T('stEng'), `${compLabel} — ${cas} personnel overcome by drench`, 2.0, P.CRIT);
  },
  ventN2Required(compLabel) {
    msg(`VENT REQUIRED — ${compLabel}`, 1.3);
    log(T('stConn'), `${T('allConn')} — ${compLabel} drenched. DC team required to vent before securing`, P.CRIT);
  },
  ventN2Started(compLabel, teamLabel) {
    msg(`VENT N2 — ${compLabel}`, 1.2);
    log(T('stEng'), `${T('connAll').split(' —')[0]}, ${teamLabel} — commencing N2 vent ${compLabel}. Stand by 60 seconds`, P.MED);
  },
  ventN2Complete(compLabel) {
    msg(`N2 CLEAR — ${compLabel}`, 1.2);
    log(T('stEng'), `${T('engConn')} — N2 clear in ${compLabel}. Entering for inspection`, P.MED);
    qlog(T('stConn'), `${T('connEng')} — ${T('aye')}. Enter ${compLabel} and report`, 1.5, P.MED);
  },
  electricalFireReignition(roomLabel, station) {
    msg('ELECTRICAL FIRE — REIGNITION', 1.5);
    log(station, `${T('connSonar').split(',')[0]}, ${station} — electrical fire reignition, ${roomLabel}. Source is damaged distribution board`, P.CRIT);
    dcLog(`ELECTRICAL FIRE REIGNITION — ${roomLabel} — damaged wiring`);
  },
  cascade(fromLabel, toLabel) {
    msg('FIRE SPREADING', 1.4);
    log(T('stEng'), `${T('connAll').split(' —')[0]}, ${fromLabel} — fire spreading to ${toLabel}`, P.CRIT);
  },
  crewReturn(compLabel, station, n) {
    log(T('stConn'), `${T('allConn')} — ${compLabel} fire out. Watchkeepers close up.`);
    qlog(station, `${T('connSonar').split(',')[0]}, ${station} — manned and ready`, 0.5);
  },
};

// ── Snorkel Flooding (Type 209) ──────────────────────────────────────
export const snorkelFlood = {
  minor() {
    msg('SNORKEL FLOOD — MINOR', 1.5);
    log(T('stManv'), `${T('connManv')} — snorkel flood. Water in the induction. Diesel stalled. Securing snorkel`, P.CRIT);
  },
  major() {
    msg('SNORKEL FLOOD — MAJOR', 2.0);
    log(T('stManv'), `${T('connManv')} — snorkel flood, major. Flooding engine compartment. Securing snorkel. Closing induction valve`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — snorkel flood. DC teams close up engine compartment`, 2.0, P.CRIT);
  },
  catastrophic() {
    msg('SNORKEL HEAD VALVE FAILURE', 3.0);
    log(T('stManv'), `${T('connManv')} — snorkel head valve failure. Catastrophic flooding through induction. All stop on snorkel. Closing induction manually`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — catastrophic snorkel flood. Emergency stations. DC teams to engine compartment`, 2.0, P.CRIT);
    dcLog('SNORKEL FLOOD — CATASTROPHIC — head valve failure', P.CRIT);
  },
};

// ── Chlorine Gas (Type 209) ─────────────────────────────────────────
export const chlorine = {
  trace() {
    msg('CHLORINE — TRACE', 1.5);
    log(T('stManv'), `${T('connManv')} — chemical contamination. Chlorine gas detected in the motor room`, P.MED);
  },
  hazardous() {
    msg('CHLORINE — HAZARDOUS', 2.0);
    log(T('stManv'), `${T('connManv')} — chlorine concentration hazardous. Crew donning emergency breathing apparatus`, P.CRIT);
    dcLog('CHLORINE HAZARDOUS — motor room — DC team effectiveness halved', P.CRIT);
  },
  lethal() {
    msg('CHLORINE — LETHAL', 2.5);
    log(T('stManv'), `${T('connManv')} — chlorine lethal concentration. Evacuating motor room. DC teams cannot enter`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — chlorine spreading through ventilation. Recommend surface and ventilate`, 2.0, P.CRIT);
    dcLog('CHLORINE LETHAL — motor room evacuated — DC entry blocked', P.CRIT);
  },
  saturated() {
    msg('CHLORINE — SATURATED', 3.0);
    log(T('stConn'), `${T('allConn')} — gas contamination spreading to adjacent sections. Hatches must be opened`, P.CRIT);
    dcLog('CHLORINE SATURATED — spreading to adjacent sections', P.CRIT);
  },
};

// ── Hot Run Torpedo ──────────────────────────────────────────────────
export const hotRun = {
  detected(tube) {
    msg('HOT RUN — TUBE ' + tube, 3.0);
    log(T('stTor'), `${T('connAll').split(' —')[0]}, Torpedo Room — HOT RUN, HOT RUN — tube ${tube}. Motor running`, P.CRIT);
    qlog(T('stTor'), `Torpedo Room — flooding tube ${tube}. Opening outer doors`, 1.5, P.CRIT);
    dcLog(`HOT RUN — tube ${tube} — 12 seconds to detonation`, P.CRIT);
  },
  ejected(tube) {
    msg('TORPEDO EJECTED', 2.0);
    log(T('stTor'), `${T('connAll').split(' —')[0]}, Torpedo Room — tube ${tube} ejected. Weapon clear of the hull`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — hot run contained. Weapon ejected. Stand by for damage assessment`, 2.0, P.MED);
    dcLog(`HOT RUN RESOLVED — tube ${tube} ejected — tube degraded`);
  },
  detonation() {
    msg('DETONATION — TORPEDO ROOM', 4.0);
    log(T('stConn'), `${T('connAll').split(' —')[0]} — detonation in the torpedo room`, P.CRIT);
    dcLog('HOT RUN DETONATION — torpedo room — catastrophic', P.CRIT);
  },
  sympatheticDetonation() {
    msg('SYMPATHETIC DETONATION', 4.0);
    log(T('stConn'), `${T('allConn')} — sympathetic detonation. Stored weapons. Torpedo room lost`, P.CRIT);
    dcLog('SYMPATHETIC DETONATION — all stored weapons — torpedo room destroyed', P.CRIT);
  },
};

// ── Hydrogen ─────────────────────────────────────────────────────────
export const hydrogen = {
  caution() {
    msg('HYDROGEN — CAUTION', 1.5);
    log(T('stManv'), `${T('connManv')} — hydrogen concentration elevated. Caution level in battery well`, P.MED);
  },
  danger() {
    msg('HYDROGEN — DANGER', 2.0);
    log(T('stManv'), `${T('connManv')} — hydrogen concentration dangerous. Recommend ventilating battery well. Request permission to come shallow`, P.CRIT);
  },
  explosive() {
    msg('HYDROGEN — EXPLOSIVE', 2.5);
    log(T('stManv'), `${T('connManv')} — hydrogen at explosive concentration. Recommend immediate ventilation`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — hydrogen explosive concentration in battery well. Secure all non-essential electrical`, 2.0, P.CRIT);
  },
  explosion(isDiesel) {
    msg('EXPLOSION — BATTERY WELL', 3.0);
    log(T('stManv'), `${T('connManv')} — explosion in the battery well. Battery bank destroyed`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — fire in engine room. Emergency stations`, 1.5, P.CRIT);
    if (isDiesel) {
      qlog(T('stManv'), `${T('connManv')} — all battery power lost. Propulsion lost. Recommend emergency surface`, 3.0, P.CRIT);
    } else {
      qlog(T('stManv'), `${T('connManv')} — EPM backup unavailable. Battery destroyed`, 3.0, P.CRIT);
    }
    dcLog('HYDROGEN EXPLOSION — battery well — BEYOND REPAIR AT SEA', P.CRIT);
  },
};

// ── Shaft Seal ───────────────────────────────────────────────────────
export const shaftSeal = {
  activated() {
    msg('SHAFT SEAL FAILURE', 2.0);
    log(T('stEng'), `${T('engConn')} — shaft seal failure. Water ingress aft of frame. Leak rate increasing with speed`, P.CRIT);
    qlog(T('stConn'), `${T('connAll').split(' —')[0]}, ${T('connAll').split(' —')[0]} — ${T('aye')}. DC teams, close up aft ends. Reduce speed to slow the leak`, 2.0, P.CRIT);
    dcLog('SHAFT SEAL FAILURE — speed-dependent leak active', P.CRIT);
  },
  speedWarning() {
    log(T('stEng'), `${T('engConn')} — shaft seal leak rate increasing with speed. Recommend reducing speed`, P.MED);
  },
};

// ── Hydraulic System ──────────────────────────────────────────────────
export const hydraulic = {
  pressureLow(hydState) {
    msg('HYDRAULIC PRESSURE LOW', 1.5);
    log(T('stConn'), `${T('connAll').split(' —')[0]}, ${T('controlRoom')} — hydraulic pressure dropping. Main plant ${hydState.toUpperCase()}. WTD operation sluggish`, P.CRIT);
    qlog(T('stEng'), `${T('engConn')} — hydraulic pressure low. Close WTDs now if required`, 2.0, P.MED);
  },
  pressureCritical() {
    msg('HYDRAULIC PRESSURE CRITICAL', 2.0);
    log(T('stConn'), `${T('connAll').split(' —')[0]}, ${T('controlRoom')} — hydraulic pressure critical. WTDs frozen. Planes shifting to air-emergency`, P.CRIT);
    qlog(T('stHelm'), `${T('helmConn')} — planes on air emergency. HPA consumption increasing`, 1.5, P.CRIT);
  },
  pressureZero() {
    msg('HYDRAULIC FAILURE', 2.5);
    log(T('stConn'), `${T('allConn')} — complete hydraulic failure. WTDs frozen in current state. Planes on air-emergency backup only`, P.CRIT);
  },
  fluidFire() {
    msg('HYDRAULIC FIRE', 1.8);
    log(T('stEng'), `${T('connAll').split(' —')[0]}, ${T('controlRoom')} — hydraulic fluid fire, Machinery Space. Aerosolised fluid on hot surfaces`, P.CRIT);
    dcLog('HYDRAULIC FIRE — MACHINERY SPACE — aerosolised fluid ignition');
  },
};

// ── Medical ───────────────────────────────────────────────────────────────
export const medical = {
  casualtyCallOut(compLabel) {
    log(T('stConn'), `CASUALTY CASUALTY CASUALTY — ${compLabel} — MEDICAL STAFF CLOSE UP`, P.CRIT);
    msg(`CASUALTY — ${compLabel}`, 2.5);
  },
  enRoute(staffLabel, compLabel) {
    log(T('stMeds'), `${staffLabel} — En route to ${compLabel}`, P.NORMAL);
  },
  onScene(staffLabel, compLabel) {
    log(T('stMeds'), `${staffLabel} — On scene ${compLabel}, assessing casualties`, P.MED);
  },
  treating(staffLabel, victimName, severity) {
    log(T('stMeds'), `${staffLabel} — Treating ${victimName} (${severity})`, P.NORMAL);
  },
  recovered(staffLabel, victimName) {
    log(T('stMeds'), `${staffLabel} — ${victimName} returned to duty`, P.MED);
  },
  bleedOut(victimName, compLabel) {
    log(T('stMeds'), `CRITICAL CASUALTY LOST — ${victimName} in ${compLabel}`, P.CRIT);
    msg(`CRITICAL CASUALTY — ${victimName}`, 3.0);
  },
  staffDown(staffLabel) {
    log(T('stMeds'), `${staffLabel} is a casualty — medical capacity reduced`, P.CRIT);
  },
  noMedStaff() {
    log(T('stMeds'), `WARNING — No medical staff available. Casualties untreated`, P.CRIT);
    msg(`NO MEDICAL STAFF`, 3.0);
  },
  allClear(staffLabel) {
    log(T('stMeds'), `${staffLabel} — All casualties treated. Returning to sick bay`, P.NORMAL);
  },
};

// ── Watch handover (nation-aware) ────────────────────────────────────────
export const watch = {
  requestRelief(watchId) {
    log(T('stConn'), `${T('oow')} — Watch ${watchId} crew fatigued. ${T('relieveWatch')}`, P.MED);
  },
  relieving(outgoing, incoming) {
    log(T('stConn'), `${T('ayeSir')}. Watch ${outgoing} — relieving the watch. Watch ${incoming} ${T('watchMustering')}`, P.NORMAL);
    dcLog(`Watch change initiated — Watch ${incoming} incoming`);
  },
  onWatch(incoming, oowName) {
    log(T('stConn'), `Watch ${incoming} ${T('assumedWatch')}. ${T('oowFull')}: ${oowName}`, P.MED);
    dcLog(`Watch ${incoming} assumed watch — ${oowName} ${T('oow')}`);
  },
  forcedChange(watchId) {
    log(T('stConn'), `WARNING — Watch ${watchId} crew exhausted. Initiating emergency watch relief`, P.CRIT);
  },
  blocked() {
    log(T('stConn'), `Cannot relieve the watch — ${T('actionStations').toLowerCase()} closed up`, P.NORMAL);
  },
};

// ════════════════════════════════════════════════════════════════════════
// SNORKEL PROCEDURES (diesel-electric boats only)
// ════════════════════════════════════════════════════════════════════════
export const snorkel = {
  ordered() {
    log(T('stConn'), `${T('connAll').split(' —')[0]}, ${T('aye')} — prepare to snorkel. Coming to snorkel depth.`, P.MED);
    msg('SNORKEL ORDERED', 1.5);
    qlog(T('stHelm'), `${T('stHelm')}, ${T('aye')} — coming to snorkel depth. Rate of rise normal.`, 1.0);
    qlog(T('stEng'),  `${T('engConn')} — snorkel induction system checked open. Standing by to raise mast.`, 2.5);
  },
  deployed() {
    log(T('stEng'),  `${T('engConn')} — snorkel mast raised. Induction open. Starting diesels.`, P.MED);
    msg('SNORKEL — RAISING MAST', 1.5);
    qlog(T('stManv'), `${T('connManv')} — diesel generators on the line. Battery charging. Making ahead slow.`, 2.0, P.MED);
    qlog(T('stEng'),  `${T('engConn')} — diesels running normally. Exhaust confirmed outboard. Charging at full rate.`, 4.0);
    qlog(T('stConn'), `${T('manvConn')} — ${T('aye')}. ${T('allConn')} — we are snorkelling. ESM watch closed up.`, 5.5, P.MED);
  },
  cancelled() {
    log(T('stConn'), `${T('connAll').split(' —')[0]} — cancel snorkel. Lowering mast. Take her back down.`, P.MED);
    msg('SNORKEL — RETRACTING', 1.2);
    qlog(T('stEng'),  `${T('engConn')} — lowering snorkel mast. Induction sealed. Securing diesels.`, 1.5);
    qlog(T('stManv'), `${T('connManv')} — diesels secured. Propulsion to battery. Hotel load normal.`, 3.5, P.MED);
    qlog(T('stConn'), `${T('manvConn')} — ${T('aye')}. Running on battery.`, 5.0);
  },
  batteryLow(pct) {
    if(pct <= 10){
      log(T('stEng'),  `${T('engConn')} — battery critical at ${pct}%. Must snorkel or reduce speed immediately.`, P.CRIT);
      qlog(T('stManv'), `${T('connManv')} — at current load, propulsion offline in under two minutes.`, 1.5, P.CRIT);
      msg(`BATTERY CRITICAL — ${pct}%`, 2.5);
    } else if(pct <= 20){
      log(T('stEng'),  `${T('engConn')} — battery low, ${pct}%. Request permission to snorkel.`, P.MED);
      msg(`BATTERY LOW — ${pct}%`, 2.0);
    } else {
      log(T('stEng'),  `${T('engConn')} — battery at ${pct}%. Recommend snorkelling at earliest opportunity.`, P.NORMAL);
    }
  },
  exhausted() {
    log(T('stManv'), `${T('connManv')} — battery exhausted. No propulsion. EPM not installed.`, P.CRIT);
    qlog(T('stEng'),  `${T('engConn')} — propulsion offline. Snorkel or surface to recover. Hotel load on reserve cells.`, 1.5, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — loss of propulsion on battery exhaustion. Boat is dead in the water. Stand by.`, 3.0, P.CRIT);
    msg('PROPULSION LOST — BATTERY DEAD', 3.0);
  },
  recovered() {
    log(T('stManv'), `${T('connManv')} — battery above minimum. Propulsion answering.`, P.MED);
    qlog(T('stEng'),  `${T('engConn')} — propulsion restored. Recommend maintaining snorkel until battery above fifty percent.`, 2.0);
    msg('PROPULSION RESTORED', 1.5);
  },
  noisyCaution() {
    log(T('stConn'), `${T('connAll').split(' —')[0]} — all stations. Snorkelling creates a detectable signature. Maintain ESM watch. Be ready to lower mast on contact.`, P.MED);
  },
};

// ════════════════════════════════════════════════════════════════════════
// MAST / ESM / RADAR
// ════════════════════════════════════════════════════════════════════════
export const mast = {
  raised(label)       { log(T('stConn'), `${label} raised`); },
  lowered(label)      { log(T('stConn'), `${label} lowered`); },
  floodWarning(label) {
    log(T('stConn'), `${T('connAll').split(' —')[0]} — ${label} below safe depth. Flooding risk — lower immediately`, P.CRIT);
    msg(`${label} FLOOD RISK`, 1.8);
  },
  crushed(label) {
    log(T('stConn'), `${label} crushed — hull flooding`, P.CRIT);
    msg(`${label} CRUSHED`, 2.5);
  },
  esmContacts(contacts) {
    for(const c of contacts.slice(0,3)){
      log('ESM', `${T('connAll').split(' —')[0]}, ESM — emitter bears ${String(c.brgDeg).padStart(3,'0')}, ${c.strength}`);
    }
    if(contacts.length>3) log('ESM', `ESM — ${contacts.length} emitters total`);
  },
  radarSweep(count) {
    if(count>0){
      log(T('stConn'), `Radar — ${count} surface contact${count>1?'s':''}`);
      log(T('stSonar'), `${T('connSonar')} — own-ship radar emission. Escorts will go active`, P.MED);
    } else {
      log(T('stConn'), 'Radar — no contacts');
    }
  },
};
