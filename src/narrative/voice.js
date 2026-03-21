'use strict';

import { log, qlog, msg, P, dcLog } from './comms.js';
import { T } from './terminology.js';

// ════════════════════════════════════════════════════════════════════════
// FLOOD EVENTS
// ════════════════════════════════════════════════════════════════════════
export const flood = {
  depthSeep(compLabel, station, tFlood) {
    log(station, `${T('connSonar').split(',')[0]}, ${station} — structural weeping in ${compLabel}. Pressure seep, rate increasing. Estimate ${tFlood}s to compartment loss without DC.`, P.CRIT);
    msg(`DEPTH FLOODING — ${compLabel}`, 2.5);
    qlog(T('stConn'), `${T('allConn')} — depth flooding casualty. ${compLabel}. DC teams, close up.`, 1.0, P.CRIT);
  },
  firstHit(compLabel, station, urgency, tFlood) {
    const t = Math.min(tFlood, 999);
    log(station, `${T('connSonar').split(',')[0]}, ${station} — flooding! Flooding in ${compLabel}!`, P.CRIT);
    qlog(T('stConn'), `${T('connAll')} — ${T('emergencyStations3x')}: Flood, flood, flood. Flooding in ${compLabel}. DC teams close up.`, 1.0, P.CRIT);
    msg(`FLOODING — ${compLabel}`, 2.5);
    dcLog(`FLOODING — ${compLabel} | ${urgency} ~${t}s to loss without DC`, P.CRIT);
  },
  secondBreach(compLabel, station) {
    log(station, `${T('connSonar').split(',')[0]}, ${station} — second breach! ${compLabel} flooding fast! Evacuate!`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — second breach in ${compLabel}. Flooding critical. All hands clear of ${compLabel}.`, 1.0, P.CRIT);
    msg(`${compLabel} — SECOND BREACH`, 3.0);
  },
  uncontrolled(compLabel, station, lost) {
    log(station, `${T('connSonar').split(',')[0]}, ${station} — flooding uncontrolled! ${compLabel} lost!`, P.CRIT);
    qlog(T('stConn'), `${T('connAll')} — close all watertight doors. ${compLabel} lost${lost > 0 ? `. ${lost} hands` : ''}.`, 1.5, P.CRIT);
    msg(`${compLabel} FLOODED`, 3.0);
  },
  critical() {
    qlog(T('stConn'), `${T('connAll')} — critical flooding. Loss of trim expected. All hands maintain emergency stations, stand by for orders.`, 1.5, P.CRIT);
    msg('CRITICAL FLOODING', 4.0);
  },
  evacuating(compLabel, station, out, trapped) {
    log(station, `${T('connSonar').split(',')[0]}, ${station} — evacuating ${compLabel}! Flooding critical!`, P.CRIT);
    if (trapped > 0) qlog(T('stConn'), `${T('allConn')} — ${compLabel} evacuating. ${out} clear, ${trapped} missing`, 1.5, P.CRIT);
    else             qlog(T('stConn'), `${T('allConn')} — ${compLabel} personnel clear. ${out} accounted for`, 1.5, P.MED);
  },
  closeWTDs(compLabel) {
    qlog(T('stConn'), `${T('allConn')} — close all watertight doors. Flooding in ${compLabel}`, 2.5, P.CRIT);
  },
  wtdClosed(station, doorLabel, delay) {
    qlog(station, `${T('connSonar').split(',')[0]}, ${station} — WTD ${doorLabel} closed`, delay, P.MED);
  },
  openWTDs() {
    qlog(T('stConn'), `${T('allConn')} — casualty controlled. Open all watertight doors. Resume normal watch.`, 2.0, P.MED);
  },
  wtdOpen(station, doorLabel, delay) {
    qlog(station, `${T('connSonar').split(',')[0]}, ${station} — WTD ${doorLabel} open`, delay, P.NORMAL);
  },
  crewReturn(compLabel, station, n) {
    log(T('stConn'), `${T('allConn')} — ${compLabel} secure. Watchkeepers close up.`);
    qlog(station, `${T('connSonar').split(',')[0]}, ${station} — manned and ready`, 0.5);
  },
  reactorFlooded() {
    log(T('stManv'), `${T('connManv')} — reactor SCRAM, primary coolant gone. EPM`, P.CRIT);
    msg('REACTOR FLOODED', 2.5);
  },
  sealed(compLabel) {
    log(T('stEng'), `${T('engConn')} — ${compLabel} sealed. Watertight`, P.MED);
    msg(`${compLabel} SEALED`, 1.5);
  },
};

// ════════════════════════════════════════════════════════════════════════
// DAMAGE CONTROL TEAMS
// ════════════════════════════════════════════════════════════════════════
export const dc = {
  mustering(teamLabel, compLabel) {
    dcLog(`${teamLabel} — mustering. En route ${compLabel} in 15s`);
    log(T('stConn'), `DC ${teamLabel} — close up. ${compLabel}. Emergency.`, P.MED);
  },
  dispatched(teamLabel, compLabel, eta) {
    dcLog(`${teamLabel} — moving. ${compLabel}, ETA ${eta}s`);
  },
  cannotCross(teamLabel) {
    msg(`${teamLabel} CANNOT CROSS — REACTOR FLOODED`, 2.0);
  },
  cannotReassign(teamLabel) {
    msg(`${teamLabel} COMMITTED — neutralise threat first`, 2.0);
  },
  autoDispatching(teamLabel, compLabel, eta) {
    dcLog(`${teamLabel} — auto-dispatched to ${compLabel}, ETA ${eta}s`);
  },
  recalled(teamLabel, wasBlow) {
    dcLog(wasBlow ? `${teamLabel} — HP blow aborted. Standing by` : `${teamLabel} — recalled. Ready`);
  },
  onScene(teamLabel, compLabel) {
    dcLog(`${teamLabel} — on scene, ${compLabel}`);
  },
  floodingActive(teamLabel) {
    dcLog(`${teamLabel} — fighting the breach`, P.MED);
  },
  floodStatus(teamLabel, pct, rate) {
    if      (rate > 0.010) dcLog(`${teamLabel} — losing the breach. ${pct}% flooded. Need assistance`, P.CRIT);
    else if (rate > 0.003) dcLog(`${teamLabel} — holding. Breach not sealed. ${pct}% flooded`, P.MED);
    else                   dcLog(`${teamLabel} — breach slowing. ${pct}% and falling`);
  },
  breachSealed(teamLabel, compLabel, nextSys, sysLabel) {
    dcLog(`${teamLabel} — breach sealed. ${nextSys ? `Moving to repairs. ${sysLabel} first` : `${compLabel} secure`}`, P.MED);
    log(T('stEng'), `${T('engConn')}, DC ${teamLabel} — breach sealed ${compLabel}. Damage assessment underway`, P.MED);
  },
  allSecure(teamLabel, compLabel) {
    dcLog(`${teamLabel} — ${compLabel} all systems restored. Standing by`, P.MED);
    log(T('stEng'), `${T('engConn')}, DC ${teamLabel} — ${compLabel} all systems restored`, P.MED);
  },
  startRepair(teamLabel, sysLabel) {
    dcLog(`${teamLabel} — starting ${sysLabel} repairs`);
  },
  repairProgress(teamLabel, sysLabel, pct, dual) {
    dcLog(`${teamLabel} — ${sysLabel} repair ${pct}%${dual ? ' [both teams]' : ''}`);
  },
  repairComplete(teamLabel, sysLabel, restored, dual) {
    dcLog(`${teamLabel} — ${sysLabel} restored, ${restored}${dual ? ' (both teams)' : ''}`, P.MED);
    log(T('stEng'), `${T('engConn')}, DC ${teamLabel} — ${sysLabel} restored, ${restored}`, P.MED);
    msg(`${sysLabel} REPAIRED`, 1.5);
  },
  casualty(teamLabel, victimName, victimStatus, sysLabel) {
    dcLog(`${teamLabel} — CASUALTY: ${victimName} ${victimStatus} during ${sysLabel} repair`, P.CRIT);
    log(T('stConn'), `${T('connAll').split(' —')[0]} — DC casualty: ${victimName} ${victimStatus}`, P.CRIT);
  },
  teamEvacuated(teamLabel, compLabel) {
    dcLog(`${teamLabel} — evacuated ${compLabel}. Casualties taken`, P.MED);
    log(T('stConn'), `${T('allConn')} — DC ${teamLabel} evacuated ${compLabel}`, P.MED);
  },
  teamLost(teamLabel, compLabel) {
    dcLog(`${teamLabel} — [LOST with ${compLabel}]`, P.CRIT);
    log(T('stConn'), `${T('allConn')} — DC ${teamLabel} lost with ${compLabel}`, P.CRIT);
  },
  teamLostSealed(teamLabel, compLabel) {
    dcLog(`${teamLabel} — [LOST — sealed inside ${compLabel}]`, P.CRIT);
  },
  blow: {
    started(teamLabel, compLabel) {
      dcLog(`${teamLabel} — ${compLabel} flooded. HP blow from bulkhead`, P.MED);
      log(T('stEng'), `${T('engConn')}, DC ${teamLabel} — HP blow, ${compLabel}. Compressors running. We are loud`, P.MED);
      msg(`HP BLOW — ${compLabel}`, 2.0);
    },
    progress(teamLabel, compLabel, pct) {
      dcLog(`${teamLabel} — ${compLabel} blow in progress. ${pct}% flooded`);
    },
    complete(teamLabel, compLabel) {
      dcLog(`${teamLabel} — ${compLabel} pressure equalised. Entering now`, P.MED);
      log(T('stEng'), `${T('engConn')}, DC ${teamLabel} — ${compLabel} pressure equalised. Entering now`, P.MED);
      msg(`${compLabel.toUpperCase()} RE-ENTERED`, 2.0);
    },
    accessible(teamLabel, compLabel) {
      dcLog(`${teamLabel} — ${compLabel} accessible. Entering`);
    },
    aborted(teamLabel) {
      dcLog(`${teamLabel} — HP blow aborted. Standing by`);
    },
  },
};

// ════════════════════════════════════════════════════════════════════════
// SYSTEM DAMAGE / REPAIR
// ════════════════════════════════════════════════════════════════════════
export const sys = {
  damaged(sysLabel, state, delay) {
    qlog(T('stEng'), `${T('engConn')} — ${sysLabel}, ${state}`, delay || 0, P.MED);
  },
  casualties(killed, wounded, compLabel) {
    qlog(T('stConn'), `${compLabel} — ${killed} down${wounded > 0 ? `, ${wounded} wounded` : ''}`, 4.0, P.CRIT);
  },
};

// ════════════════════════════════════════════════════════════════════════
// REACTOR
// ════════════════════════════════════════════════════════════════════════
export const reactor = {
  scram(cause) {
    if (cause === 'depth') {
      log(T('stManv'), `${T('connManv')} — reactor SCRAM. Rods are in. Switching to EPM`, P.CRIT);
      qlog(T('stEng'), `${T('engConn')} — SCRAM on coolant temperature excursion. She could not take the load at that depth`, 1.5, P.MED);
    } else if (cause === 'turn') {
      log(T('stManv'), `${T('connManv')} — reactor SCRAM. Rods are in. Switching to EPM`, P.CRIT);
      qlog(T('stEng'), `${T('engConn')} — SCRAM on high flux signal. Coolant pumps cavitated on that angle. Reactor tripped`, 1.5, P.MED);
    } else if (cause === 'fire') {
      log(T('stManv'), `${T('connManv')} — fire in reactor compartment. SCRAM reactor. Rods in, switching to EPM`, P.CRIT);
      qlog(T('stEng'), `${T('engConn')} — reactor manually tripped. EPM in service. Holding restart pending casualty resolution`, 2.0, P.CRIT);
    } else if (cause === 'coolant') {
      log(T('stManv'), `${T('connManv')} — primary coolant failure. Automatic SCRAM. Rods in, switching to EPM`, P.CRIT);
      qlog(T('stEng'), `${T('engConn')} — primary coolant loop integrity lost. Reactor tripped on low flow`, 1.5, P.CRIT);
    } else {
      log(T('stManv'), `${T('connManv')} — reactor SCRAM. Rods in. EPM`, P.CRIT);
    }
    msg('REACTOR SCRAM', 2.0);
  },
  fireScramLifted() {
    log(T('stManv'), `${T('connManv')} — reactor compartment clear. Commencing fast recovery startup`, P.MED);
  },
  scramHoldRepair() {
    log(T('stManv'), `${T('connManv')} — SCRAM cleared. Reactor fire damage confirmed. Holding restart pending DC repairs`, P.MED);
    qlog(T('stEng'), `${T('engConn')} — reactor panels show multiple faults. Cannot restart until systems restored. DC teams to work`, 2.0, P.MED);
  },
  repairReadyRestart(state) {
    if(state==='nominal'){
      log(T('stManv'), `${T('connManv')} — reactor systems nominal. Ready to recommence startup procedure`, P.MED);
      qlog(T('stEng'), `${T('engConn')} — commencing fast recovery startup. Standing by on rod withdrawal`, 1.5, P.MED);
    } else {
      log(T('stManv'), `${T('connManv')} — reactor partially repaired (${state}). Reactor non-operational. Further repairs required`, P.MED);
    }
  },
  epmon() {
    log(T('stManv'), `${T('connManv')} — EPM on the line. Making three knots. That is all I have`, P.MED);
    log(T('stConn'), `${T('manvConn')} — ${T('aye')}. ${T('allConn')} — EPM only. Hold your depth and course.`, P.MED);
  },
  recoveryStart() {
    log(T('stEng'),  `${T('engConn')} — commencing fast recovery startup. Standing by on rod withdrawal`, P.MED);
    log(T('stConn'), `${T('allConn')} — reactor recovery in progress. Rig for reduced electrical. Maintain silence.`, P.MED);
  },
  recoveryProgress(step) {
    const lines = [
      [T('stManv'), `${T('connManv')} — primary coolant circulating. Temperature stabilising`],
      [T('stManv'), `${T('connManv')} — pulling rods. Reactor approaching criticality`],
      [T('stEng'),  `${T('engConn')} — we have a self-sustaining reaction. Power rising`],
      [T('stManv'), `${T('connManv')} — turbines online. Answering half ahead. EPM secured`, P.MED],
      [T('stConn'), `${T('manvConn')} — good news. Half ahead when you are ready.`, P.MED],
      [T('stEng'),  `${T('engConn')} — reactor is back in the normal operating band. All propulsion systems normal`, P.MED],
    ];
    if (lines[step]) log(lines[step][0], lines[step][1], lines[step][2]||P.NORMAL);
  },
  online() { msg('REACTOR ONLINE', 1.5); },
  coolantLeak(count=1) {
    if(count <= 1){
      log(T('stManv'), `${T('connManv')} — primary coolant pressure dropping. We have a leak in the primary loop`, P.CRIT);
      qlog(T('stEng'), `${T('engConn')} — estimating automatic SCRAM in forty-five seconds. Recommend reducing speed to give DC a chance to isolate`, 2.0, P.CRIT);
      msg('COOLANT LEAK', 2.0);
    } else if(count === 2){
      log(T('stManv'), `${T('connManv')} — primary coolant pressure dropping again. Second leak`, P.CRIT);
      qlog(T('stEng'), `${T('engConn')} — DC reports the patch is not holding. We need to slow down`, 1.5, P.CRIT);
      msg('COOLANT LEAK — RECURRING', 2.0);
    } else {
      log(T('stManv'), `${T('connManv')} — another primary coolant leak. System is failing`, P.CRIT);
      qlog(T('stEng'), `${T('engConn')} — we cannot keep isolating these. SCRAM is inevitable if we maintain this speed and depth`, 1.5, P.CRIT);
      msg('COOLANT — CRITICAL', 2.5);
    }
  },
  coolantLeakProgress() {
    log(T('stEng'), `${T('engConn')} — DC working the leak. Coolant pressure still falling`, P.MED);
  },
  coolantLeakIsolated() {
    log(T('stManv'), `${T('connManv')} — primary coolant leak isolated. Pressure stabilising`, P.MED);
    qlog(T('stEng'), `${T('engConn')} — good work by DC. Reactor maintaining power. Resuming normal operations`, 1.5, P.MED);
    msg('LEAK ISOLATED', 1.5);
  },
  coolantLeakFailed() {
    log(T('stEng'), `${T('engConn')} — cannot isolate the leak. SCRAM is imminent`, P.CRIT);
  },
  steamLeak() {
    log(T('stManv'), `${T('connManv')} — main steam isolation! Answering on the diesel`, P.CRIT);
    qlog(T('stEng'), `${T('engConn')} — steam leak in the main loop. DC closing up. Diesel generator on the line, making seven knots`, 2.0, P.CRIT);
    msg('MAIN STEAM ISOLATION', 2.0);
  },
  steamRestored() {
    log(T('stManv'), `${T('connManv')} — main steam restored. Full propulsion available`, P.MED);
    qlog(T('stEng'), `${T('engConn')} — steam leak repaired. Turbines answering ahead`, 1.5, P.MED);
    msg('STEAM RESTORED', 1.5);
  },
  turbineTrip() {
    log(T('stManv'), `${T('connManv')} — turbine trip! Max turns for twelve knots`, P.CRIT);
    msg('TURBINE TRIP', 1.5);
  },
  turbineRecovered() {
    log(T('stManv'), `${T('connManv')} — turbines back on the line. Full power available`, P.MED);
    msg('TURBINES ONLINE', 1.0);
  },
  reactorRunaway() {
    log(T('stManv'), `${T('connManv')} — positive scram! Uncontrolled rod withdrawal, automatic trip. Rods in, switching to EPM`, P.CRIT);
    qlog(T('stEng'), `${T('engConn')} — reactor tripped on positive period. Loud transient on that one. Commencing fast recovery`, 2.0, P.CRIT);
    msg('REACTOR SCRAM', 2.0);
  },
};

// ════════════════════════════════════════════════════════════════════════
// ESCAPE
// ════════════════════════════════════════════════════════════════════════
export const escape = {
  tceNotViable() { msg('TCE NOT VIABLE — TOO DEEP OR NO TOWERS', 2.0); },
  tce() {
    log(T('stConn'), `${T('connAll')} — TCE. Escape tower parties, close up. This is not a drill.`, P.CRIT);
    msg('TCE INITIATED', 2.0);
  },
  rush() {
    log(T('stConn'), `${T('connAll')} — RUSH ESCAPE. Abandon ship, abandon ship. This is not a drill.`, P.CRIT);
    msg('RUSH ESCAPE — ALL HANDS GO', 2.5);
  },
};

// ════════════════════════════════════════════════════════════════════════
// PLANES
// ════════════════════════════════════════════════════════════════════════
export const planes = {
  fwdAirEmergency() {
    log(T('stHelm'), `${T('helmConn')} — forward planes hydraulics lost. Switching to air emergency.`, P.CRIT);
    qlog(T('stEng'),  `${T('engConn')} — forward planes on air emergency. HPA consumption will increase. Response degraded.`, 1.5, P.MED);
    msg('FWD PLANES — AIR EMERGENCY', 2.0);
  },
  fwdControlLost() {
    log(T('stHelm'), `${T('helmConn')} — forward planes control lost. Planes are frozen.`, P.CRIT);
    msg('FWD PLANES — FROZEN', 2.5);
  },
  fwdHydraulicRestored() {
    log(T('stEng'),  `${T('engConn')} — forward planes hydraulics restored. Normal response.`, P.MED);
  },
  aftAirEmergency(ctrlTransferred) {
    log(T('stHelm'), `${T('helmConn')} — aft planes hydraulics lost. Switching to air emergency.`, P.CRIT);
    qlog(T('stEng'),  `${T('engConn')} — aft planes on air emergency. HPA consumption will increase. Response degraded.`, 1.5, P.MED);
    if(ctrlTransferred){
      qlog(T('stManv'), `${T('connManv')} — we have the planes aft. Standing by on air emergency.`, 2.5, P.MED);
    }
    msg('AFT PLANES — AIR EMERGENCY', 2.0);
  },
  aftControlTransferred() {
    log(T('stManv'), `${T('connManv')} — assuming aft plane control. ${T('stHelm')}, transfer complete.`, P.MED);
    qlog(T('stHelm'), `${T('manvConn').split(',').reverse().join(', ').trim()}, ${T('stHelm')} — ${T('aye')}, planes transferred aft.`, 1.0, P.MED);
  },
  aftHydraulicRestored() {
    log(T('stEng'),  `${T('engConn')} — aft planes hydraulics restored. Normal response.`, P.MED);
  },
  planesFrozenNoHPA(angleNow) {
    const dir = angleNow > 0 ? 'rise' : angleNow < 0 ? 'dive' : 'neutral';
    log(T('stHelm'), `${T('helmConn')} — planes frozen. No HP air. Planes locked ${Math.abs(angleNow)}° ${dir}.`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — planes are frozen in ${dir}. Ballast control only.`, 1.0, P.CRIT);
    msg('PLANES FROZEN', 3.0);
  },
  stuckPlanes(set, direction) {
    const setLabel = set === 'fwd' ? 'FORWARD' : 'AFT';
    const dirLabel = direction === 'neutral' ? 'NEUTRAL' : direction.toUpperCase();
    msg(`PLANES JAM — ${setLabel}`, 2.5);
    log(T('stHelm'), `${T('helmConn')} — planes jam, ${setLabel.toLowerCase()} planes. Jammed in ${dirLabel.toLowerCase()}`, P.CRIT);
    qlog(T('stHelm'), `${T('helmConn')} — shifting to backup control`, 1.5, P.MED);
    if (direction !== 'neutral') {
      qlog(T('stConn'), `${T('allConn')} — depth rate increasing from jammed planes. Stand by for emergency manoeuvre`, 3.0, P.CRIT);
    }
  },
  stuckPlanesRecovered(set) {
    const setLabel = set === 'fwd' ? 'forward' : 'aft';
    msg(`${setLabel.toUpperCase()} PLANES — BACKUP CONTROL`, 1.5);
    log(T('stHelm'), `${T('helmConn')} — backup control established. ${setLabel.charAt(0).toUpperCase()+setLabel.slice(1)} planes on air-emergency`, P.MED);
    qlog(T('stConn'), `${T('helmConn')} — compensating on remaining planes`, 2.0, P.MED);
  },
  stuckPlanesFailed(set) {
    const setLabel = set === 'fwd' ? 'forward' : 'aft';
    msg(`${setLabel.toUpperCase()} PLANES — JAMMED HARD`, 2.5);
    log(T('stHelm'), `${T('helmConn')} — unable to recover ${setLabel} planes. Planes jammed hard`, P.CRIT);
    qlog(T('stConn'), `${T('allConn')} — ${setLabel} planes lost. Compensating on remaining planes`, 2.0, P.CRIT);
  },
};

// ════════════════════════════════════════════════════════════════════════
// COMBAT / TORPEDO THREATS
// ════════════════════════════════════════════════════════════════════════
export const combat = {
  torpedoInWater(brgStr) {
    msg('TORPEDO IN THE WATER!', 3.0);
    log(T('stSonar'), `${T('connSonar')} — new contact, high-speed screws, bears ${brgStr}, classify torpedo`, P.CRIT);
    log(T('stConn'),  `${T('connAll')} — ${T('actionStations3x')}: Torpedo threat. Close up evasion stations.`, P.CRIT);
  },
  seekerActive(brgStr) {
    log(T('stSonar'), `${T('connSonar')} — torpedo bears ${brgStr}, seeker active, weapon is hunting`, P.MED);
    log(T('stConn'),  `${T('allConn')} — stand by for emergency manoeuvre. ${T('stHelm')}, await my order.`, P.MED);
    msg('TORPEDO SEEKER ACTIVE', 2.5);
  },
  torpedoClosing(brgStr, recipDeg) {
    log(T('stSonar'), `${T('connSonar')} — torpedo bears ${brgStr}, high closing rate, inbound`, P.CRIT);
    log(T('stConn'),  `${T('connHelm')} — come to ${recipDeg}, emergency deep, full ahead`, P.CRIT);
    msg(`TURN TO ${recipDeg} — EMERGENCY DEEP`, 3.0);
  },
  weaponAcquisition(brgStr, recipDeg) {
    log(T('stSonar'), `${T('connSonar')} — weapon has acquisition, bears ${brgStr}, impact imminent`, P.CRIT);
    log(T('stConn'),  `${T('allConn')} — steer ${recipDeg}, emergency deep, flank speed. Deploy all countermeasures`, P.CRIT);
    msg('WEAPON HAS ACQUISITION', 4.0);
  },
  targetDestroyed(contactType) {
    if(contactType === 'civilian'){
      log(T('stSonar'), `${T('connSonar')} — breaking-up noises. Merchant vessel destroyed`, P.CRIT);
      msg('CIVILIAN VESSEL DESTROYED', 3.5);
      qlog(T('stConn'), `${T('connAll').split(' —')[0]} — that was a civilian vessel. This will be reported.`, 2.0, P.CRIT);
    } else {
      log(T('stSonar'), `${T('connSonar')} — breaking-up noises. ${contactType === 'boat' ? 'Surface contact' : 'Submerged contact'} destroyed`, P.MED);
      msg('TARGET DESTROYED', 2.5);
    }
  },
  counterShot(n, degStr) {
    log(T('stSonar'), `${T('connSonar')} — ${n} torpedo${n > 1 ? 's' : ''} in the water, bears ${degStr}, reciprocal`, P.CRIT);
    msg(`COUNTER-SHOT — ${n} WEAPONS INBOUND`, 2.5);
  },
  enemyCountermeasures() {
    log(T('stSonar'), `${T('connSonar')} — contact manoeuvring, high speed. Countermeasures in water`, P.MED);
  },
};

// ════════════════════════════════════════════════════════════════════════
// WEAPONS / TUBES
// ════════════════════════════════════════════════════════════════════════
export const weapons = {
  shootOrder(manual) {
    log(T('stConn'), manual ? 'Fire, manual bearing' : 'Fire on solution');
  },
  solutionSet(tube) {
    log(T('stWeps'), `${T('wepsConn')} — tube ${tube}, solution set`);
  },
  floodingDown(tube) {
    log(T('stWeps'), `Tube ${tube}, flooding down`);
  },
  tubeReady(tube) {
    log(T('stWeps'), `${T('wepsConn')} — tube ${tube} ready in all respects, outer door open`);
  },
  fired(tube, wire) {
    log(T('stWeps'), `Tube ${tube} fired electrically`);
    if (wire) log(T('stSonar'), `${T('connSonar')} — own unit is away, running normally. Wire live`);
    else      log(T('stSonar'), `${T('connSonar')} — own unit is away, running normally`);
  },
  wireParted(tube, cause) {
    if (cause === 'launch') {
      log(T('stWeps'), `${T('wepsConn')} — tube ${tube}, wire parted on launch, unit running free`, P.MED);
    } else if (cause === 'runout') {
      msg('WIRE PARTED — RUNOUT', 0.8);
      log(T('stWeps'), `${T('wepsConn')} — wire parted, runout. Tube reloading`, P.MED);
    } else if (cause === 'speed') {
      msg('WIRE PARTED — OVERSPEED', 1.0);
      log(T('stWeps'), `${T('wepsConn')} — wire parted, overspeed. Unit running free.`, P.MED);
    } else if (cause === 'turn') {
      msg('WIRE PARTED — MANOEUVRE', 1.0);
      log(T('stWeps'), `${T('wepsConn')} — wire parted on emergency turn. Unit running free.`, P.MED);
    } else if (cause === 'dive') {
      msg('WIRE PARTED — MANOEUVRE', 1.0);
      log(T('stWeps'), `${T('wepsConn')} — wire parted on crash dive. Unit running free.`, P.MED);
    } else {
      msg('WIRE PARTED', 0.8);
      log(T('stWeps'), `${T('wepsConn')} — wire cut, manual. Torpedo running free.`);
    }
  },
  reloaded(tube) {
    log(T('stWeps'), `${T('wepsConn')} — tube ${tube} reloaded, ready in all respects`);
  },
  loadOrder(tube, weaponLabel) {
    log(T('stWeps'), `${T('wepsConn')} — ${T('aye')}. Loading tube ${tube} with ${weaponLabel}`);
    msg(`LOADING T${tube}\u2026`, 0.7);
  },
  loadComplete(tube, weaponLabel) {
    log(T('stWeps'), `${T('wepsConn')} — tube ${tube} loaded, ${weaponLabel} ready in all respects`);
  },
  unloadOrder(tube) {
    log(T('stWeps'), `${T('wepsConn')} — ${T('aye')}. Unloading tube ${tube}, weapon coming back`);
    msg(`UNLOADING T${tube}\u2026`, 0.7);
  },
  unloadComplete(tube) {
    log(T('stWeps'), `${T('wepsConn')} — tube ${tube} unloaded, weapon secured in the rack`);
  },
  strikeReloadOrder(tube, weaponLabel) {
    log(T('stWeps'), `${T('wepsConn')} — ${T('aye')}. Strike reload, tube ${tube} with ${weaponLabel}`);
    msg(`STRIKE RELOAD T${tube}\u2026`, 0.7);
  },
  strikeReloadComplete(tube, weaponLabel) {
    log(T('stWeps'), `${T('wepsConn')} — tube ${tube} reloaded, ${weaponLabel} ready in all respects`);
  },
  torpRoomBusy() {
    log(T('stWeps'), `${T('wepsConn')} — torpedo room busy, stand by`);
    msg('TORP ROOM BUSY', 0.7);
  },
  firingProcedures(tube, weaponLabel, contactId, manual) {
    if (manual) {
      log(T('stConn'), `${T('connWeps')} — firing point procedures, tube ${tube}, ${weaponLabel}, manual bearing`);
    } else {
      const trk = contactId ? `, track ${contactId}` : '';
      log(T('stConn'), `${T('connWeps')} — firing point procedures, tube ${tube}, ${weaponLabel}${trk}`);
    }
    msg('FIRING\u2026', 0.6);
  },
  fppAck(tube, weaponLabel, contactId) {
    const trk = contactId ? `, ${contactId}` : '';
    log(T('stWeps'), `Tube ${tube}, ${weaponLabel}${trk} — ${T('aye')}. Prepare tube ${tube}`);
  },
  shipReady() {
    log(T('stNav'), 'Ship ready');
  },
  weaponReady() {
    log(T('stWeps'), 'Weapon ready');
  },
  fireOrder(tube, weaponLabel, contactId, manual) {
    if (manual) {
      log(T('stConn'), `Fire, tube ${tube}, ${weaponLabel}, manual bearing`);
    } else {
      const trk = contactId ? `, ${contactId}` : '';
      log(T('stConn'), `Fire, tube ${tube}, ${weaponLabel}${trk}`);
    }
  },
  missileAway() {
    msg(T('missileAway'), 1.4);
    log(T('stSonar'), `${T('connSonar')} — launch transient. Missile airborne`);
  },
  missileHit(target) {
    msg('TARGET HIT', 1.8);
    log(T('stSonar'), `${T('connSonar')} — detonation. ${target} hit`);
  },
  missileMiss() {
    msg('MISS', 1.2);
    log(T('stSonar'), `${T('connSonar')} — detonation in water. No target struck`);
  },
  missileDefeat(target) {
    msg('MISSILE DEFEATED', 1.5);
    log(T('stSonar'), `${T('connSonar')} — ${target} CIWS active. Missile defeated`);
  },
  vlsLaunchSequence(cell, weaponLabel, contactId) {
    log(T('stConn'), `${T('connWeps')} — firing point procedures, VLS cell ${cell}, ${weaponLabel}, ${contactId}`);
    qlog(T('stWeps'), `${T('wepsConn')} — VLS cell ${cell}, ${weaponLabel}, ${contactId}, ${T('aye')}. Preparing cell`, 1.0);
    qlog(T('stWeps'), `${T('wepsConn')} — cell ${cell} pressurised. Solution set. Ready to fire`, 2.5);
    msg('VLS READY', 2.5);
  },
  vlsFired(cell, weaponLabel, contactId) {
    log(T('stConn'), `Fire, VLS cell ${cell}, ${weaponLabel}, ${contactId}`);
    qlog(T('stWeps'), `VLS cell ${cell} fired electrically — ${weaponLabel} airborne`, 0.6);
    msg(T('missileAway'), 1.2);
  },
  stadimeterObserve(contactId) {
    log(T('stConn'), `${T('connWeps')} — stadimeter observation, ${contactId}. Mark when ready`);
    msg('STADIMETER\u2026', 3.5);
  },
  stadimeterComplete(classKnown) {
    const acc = classKnown ? '\u00b118%' : '\u00b130%';
    log(T('stWeps'), `${T('wepsConn')} — stadimeter complete. Range estimate locked, accuracy ${acc}`);
  },
  stadimeterInterrupted() {
    log(T('stWeps'), `${T('wepsConn')} — stadimeter interrupted. No range estimate`);
    msg('STADIMETER ABORTED', 0.8);
  },
  unableFiring() {
    msg('FIRING IN PROGRESS', 0.8);
    log(T('stWeps'), `${T('wepsConn')} — unable. Firing sequence in progress.`);
  },
  error(why) {
    msg(why.toUpperCase(), 0.8);
    log(T('stWeps'), why, P.MED);
  },
  noSolution() {
    log(T('stWeps'), `${T('wepsConn')} — unable. No firing solution. Designate a contact.`);
  },
  fireControlOffline() {
    log(T('stWeps'), `${T('wepsConn')} — fire control offline`, P.MED);
  },
  missileDepthWarning(wl, depth, maxD) {
    msg('DEPTH RISK — ATTEMPTING', 1.4);
    log(T('stWeps'), `${T('wepsConn')} — ${wl} depth envelope is ${maxD}m. We are at ${Math.round(depth)}m. Attempting launch.`, P.MED);
  },
  missileLaunchFail(wl) {
    msg('MISFIRE', 1.6);
    log(T('stWeps'), `${T('wepsConn')} — misfire. ${wl} capsule failed to surface. Tube flooding — safe.`, P.CRIT);
    qlog(T('stWeps'), `${T('wepsConn')} — weapon lost. Tube secure.`, 2.0, P.MED);
  },
  vlsLaunchFail(wl, cell) {
    msg('VLS MISFIRE', 1.6);
    log(T('stWeps'), `${T('wepsConn')} — VLS misfire, cell ${cell}. ${wl} eject failed. Cell intact — available for re-fire.`, P.CRIT);
  },
  away()       { msg(T('torpedoAway'), 1.2); },
  countermeasures() {
    msg('NOISEMAKER OUT', 0.9);
    log(T('stConn'), `${T('connWeps')} — deploy countermeasures`);
    log(T('stWeps'), `${T('wepsConn')} — noisemaker away`);
    qlog(T('stSonar'), `${T('connSonar')} — decoy running, own noise masking`, 1.5);
  },
};
