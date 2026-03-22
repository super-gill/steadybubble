# Mission System — Design Document

**Date:** 2026-03-22
**Status:** PLANNING
**Scope:** Mission objectives, ROE system, role reversal scenarios, NATO AI enemies

---

## 1. Problem Statement

The game is too easy. The NATO vs Soviet detection asymmetry is historically accurate — NATO SSNs detect Soviet submarines at 15-20nm, while Soviet boats struggle to detect a quiet NATO sub at 10nm. The player can sit, detect, track, and engage without ever being challenged.

The fix is not to make the AI cheat. The fix is **mission structure** that forces the player into situations where the asymmetry is challenged:
- Objectives that require movement (exposure)
- Rules of engagement that prevent shoot-on-sight
- Role reversal where the player IS the disadvantaged side
- NATO enemies (for role reversal) that use proper NATO sonar and doctrine

---

## 2. Rules of Engagement (ROE)

ROE applies to ALL scenarios. It is a systemic feature, not per-scenario.

### ROE States

| State | Meaning | Fire permission |
|-------|---------|----------------|
| **WEAPONS HOLD** | Do not fire unless fired upon | Self-defence only — enemy must fire first |
| **WEAPONS TIGHT** | Fire only on classified hostile contacts | Must classify to Stage 2+ (SSN/SSK/SSBN/SSGN) before engaging |
| **WEAPONS FREE** | Unrestricted engagement | Any valid military target |

### ROE Escalation Triggers

| Trigger | Escalation |
|---------|-----------|
| Mission briefing | Starting ROE set per scenario |
| Enemy fires torpedo at player | WEAPONS FREE on that contact |
| Enemy enters exclusion zone (SSBN patrol) | WEAPONS FREE |
| Player is classified by enemy (IDENTIFIED state on enemy) | WEAPONS TIGHT → WEAPONS FREE (discretionary) |
| Player is ordered to escalate (timed event / mission phase) | As briefed |

### Classification Requirements

| Contact Type | Engagement Rules |
|-------------|-----------------|
| MERCHANT | **NEVER** a valid target. Firing = mission failure. |
| SURFACE WARSHIP | Valid only at WEAPONS FREE or in self-defence |
| SUBMERGED — unclassified | **Cannot engage.** Must classify first. |
| SUBMERGED — classified hostile (SSN/SSK/SSBN/SSGN) | Valid at WEAPONS TIGHT or FREE |
| SUBMERGED — classified friendly | **NEVER** a valid target. Firing = mission failure. |

### Penalties

| Violation | Consequence |
|-----------|------------|
| Fire on unclassified contact | Mission score penalty. "Conn, Weps — target not classified!" |
| Fire on merchant | **Mission failure.** "ALL STOP. Civilian vessel struck." |
| Fire on friendly | **Mission failure.** |
| Fire in WEAPONS HOLD (no hostile action) | Mission score penalty. ROE violation logged. |

### Implementation Notes
- ROE state stored in `session.roe` ('hold' | 'tight' | 'free')
- Fire gate in player-control.js checks ROE before allowing torpedo/missile launch
- Player's sonar contact classification (Stage 1/2/3) determines if target is valid
- UI shows current ROE state prominently
- Comms messages for ROE changes ("Conn, Radio — flash traffic. Weapons free, weapons free.")

---

## 3. Mission Objectives

### Objective Types

| Type | Description | Success Condition |
|------|-------------|-------------------|
| **TRANSIT** | Reach a designated point | Player enters waypoint radius |
| **PATROL** | Hold a sector for a duration | Player stays in zone for X minutes |
| **TRAIL** | Maintain contact on a target | Sonar contact held for X minutes without being detected |
| **LAUNCH** | Fire weapons at assigned targets | Weapons launched from correct basket |
| **EXTRACT** | Reach extraction point after completing primary | Player enters extraction radius |
| **SURVIVE** | Stay alive for mission duration | Timer expires, player alive |

### Mission Structure

Each mission has:
```
mission = {
  title: 'BARRIER TRANSIT',
  briefing: 'Transit through the GIUK barrier...',
  roe: 'tight',                    // starting ROE
  objectives: [
    { type: 'transit', label: 'Reach waypoint ALPHA', wx: ..., wy: ..., radius: 5*NM },
    { type: 'extract', label: 'Reach extraction point', wx: ..., wy: ..., radius: 8*NM },
  ],
  timeLimit: 3600,                 // seconds (sim time). 0 = no limit.
  failConditions: ['killed', 'civilian_kill', 'friendly_fire'],
  scoring: { ... },
}
```

### Waypoint / Zone Rendering
- Waypoints shown as circles on tactical display
- Patrol zones shown as rectangles
- Current objective highlighted
- Distance/bearing to objective shown in HUD

---

## 4. Mission Types

### 4.1 — Barrier Transit (NATO SSN)
- **ROE:** WEAPONS TIGHT
- **Objective:** Transit from south to north through the GIUK barrier
- **Threats:** 4 Soviet SSNs in barrier line, 2 frigates, active sonar
- **Constraints:** Must classify before engaging. Civilians in the area (fishing fleet, merchants).
- **Success:** Reach northern extraction point

### 4.2 — SSBN Patrol (Soviet SSBN) ★ ROLE REVERSAL
- **ROE:** WEAPONS HOLD (escalates if detected)
- **Objective:** Complete 30-minute patrol of assigned zone without being detected
- **Threats:** 1-2 NATO SSNs (LA-class / Trafalgar) actively hunting. Possible P-3 sonobuoy drop.
- **Constraints:** Stay in patrol zone. Minimise speed. Do not engage unless engaged.
- **Success:** Patrol timer expires, player not detected
- **Player vessel:** Typhoon, Delta IV, or Yankee class (new playable vessels)

### 4.3 — Trail the Boomer (NATO SSN)
- **ROE:** WEAPONS HOLD (intelligence mission)
- **Objective:** Find the Soviet SSBN, close to within 5nm, maintain contact for 20 minutes
- **Threats:** SSBN escort SSN. Detection = mission compromise.
- **Constraints:** Do NOT fire. Do not be detected. Classification required.
- **Success:** 20 minutes of sustained contact within 5nm

### 4.4 — TLAM Strike (NATO SSN)
- **ROE:** WEAPONS FREE (wartime)
- **Objective:** Transit to launch basket, fire TLAM at assigned target, extract
- **Threats:** ASW forces defending the coast. Surface group between you and the basket.
- **Constraints:** Must reach specific area, come to launch depth (<30m), fire missiles
- **Success:** Missiles launched, player extracts alive

### 4.5 — Detected and Hunted (NATO SSN)
- **ROE:** WEAPONS FREE (survival)
- **Objective:** Reach extraction point 40nm away. Your position is compromised.
- **Threats:** 4+ Soviet units converging on your datum. ASW surface group.
- **Constraints:** They have your datum. You're moving through their search pattern.
- **Success:** Reach extraction alive

### 4.6 — SSBN Sanitisation (NATO SSN)
- **ROE:** WEAPONS TIGHT
- **Objective:** Clear a patrol area of hostile submarines. Friendly SSBN will enter after.
- **Threats:** 2-3 Soviet SSNs in the zone.
- **Constraints:** Must classify before engaging. Clear the zone (all threats neutralised or driven off).
- **Success:** Zone clear, no hostile contacts remaining

---

## 5. Role Reversal — Soviet Playable Vessels

### Required New Vessels

| Class | NATO Designation | Type | Character |
|-------|-----------------|------|-----------|
| **Project 941 Akula** | TYPHOON | SSBN | Massive, deep-diving, 20 missiles. Very noisy. The ultimate stealth challenge. |
| **Project 667BDRM** | DELTA IV | SSBN | Standard Soviet SSBN. Quieter than Typhoon. Long-range missiles. |
| **Project 671RTM** | VICTOR III | SSN | Soviet workhorse SSN. Towed array. Noisier than NATO but capable. |

### What Changes When Playing Soviet

| System | NATO (current) | Soviet |
|--------|---------------|--------|
| Sonar | BQQ-5 / Type 2076 — excellent | MGK-500/540 — good but noisier self-noise |
| Own noise | Very quiet (noise floor 0.08-0.15) | Noisy (noise floor 0.25-0.45) |
| Weapons | MK-48 ADCAP / Spearfish — best in class | SET-65E / USET-80 — shorter range, slower |
| Towed array | TB-16/TB-23 — long, sensitive | Pelamida-B — shorter, less sensitive |
| Max depth | 250-480m | 300-600m (Typhoon: 400m, Victor III: 400m) |
| Speed | 30-35kt max | 30-35kt (Typhoon: 25kt, Victor III: 30kt) |

### Required New Weapons (Soviet)

| Weapon | Type | Speed | Range | Notes |
|--------|------|-------|-------|-------|
| SET-65E | Torpedo | 40kt | 16km | Standard Soviet heavyweight. Older, wake-homing. |
| USET-80 | Torpedo | 45kt | 18km | Improved. Active/passive seeker. |
| 65-76A | Torpedo | 50kt | 50km | Long-range wake-homer. Anti-ship focused. |
| RPK-2 Vyuga | ASW rocket | Supersonic | 40km | Nuclear depth bomb. Soviet SUBROC equivalent. |
| SS-N-20 Sturgeon | SLBM | N/A | 8,300km | Typhoon's missiles (for SSBN launch mission) |

### Required NATO AI Enemies

| Class | Type | Character |
|-------|------|-----------|
| Los Angeles (688) | SSN | Quiet, excellent sonar. The primary hunter. |
| Trafalgar | SSN | Very quiet, pumpjet. Dangerous. |

These use the same AI system but with:
- Lower noise floor (0.08-0.12 instead of 0.15-0.45)
- Better array gain (+25-30dB instead of +18-20dB)
- Better sonar processing (tighter bearing noise)
- NATO weapons (MK-48, Spearfish)
- NATO doctrine (more patient TMA, fire at longer range)

---

## 6. Implementation Priority

| Priority | Feature | Depends On |
|----------|---------|-----------|
| 1 | ROE system (session.roe, fire gate, UI) | Nothing |
| 2 | Mission objective system (waypoints, zones, timer) | Nothing |
| 3 | Existing scenarios updated with objectives + ROE | 1, 2 |
| 4 | Soviet playable vessels (Typhoon, Victor III) | New vessel layouts |
| 5 | Soviet weapons (SET-65E, USET-80) | Weapon definitions |
| 6 | NATO AI enemies (688, Trafalgar as enemies) | AI parameter profiles |
| 7 | SSBN patrol scenario | 4, 5, 6 |
| 8 | Trail the boomer scenario | 2 |
| 9 | TLAM strike scenario (needs coastal map) | 2, new location |

---

## 7. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | How does the player receive ROE changes? Radio message? Timed? Event-driven? | Open |
| 2 | Should friendly units exist in scenarios? (Escorts, friendly SSBNs) | Open — complex AI needed |
| 3 | TLAM strike needs a coastal location — separate map or extend GIUK? | Open |
| 4 | Soviet vessel layouts — do we need full schematic layouts like NATO boats? | Open |
| 5 | SLBM launch — is this a gameplay mechanic or just flavour? | Open |
| 6 | How do we handle mission scoring? Time, stealth, kills, objectives? | Open |
| 7 | Should scenarios be replayable with different random setups? | Currently yes — random bearings/distances |
