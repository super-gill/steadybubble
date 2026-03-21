# Vessel Individuality — Session Log

Detailed record of each work session. Read this to understand what was done, what problems were encountered, and how they were solved.

---

## Session 1 — 2026-03-20: Planning & LA Class Schematic

### What was done
- Created the upgrade design document (DESIGN.md)
- Created the layout communication template (LAYOUT-TEMPLATE.md)
- Updated constitution (manual.md) v3→v4:
  - Chapter 4A: crew complements and nation-specific watch roles (USN, RN, Deutsche Marine)
  - Chapter 9A: magazine/tube mechanics with swap restriction
  - Chapter 13: vessel-specific compartmentation from real schematics, pressure hull vs external equipment
  - Chapter 14: Type 209 DC team open question
  - Chapter 17: crew size impact on watch quality
- Established terminology: unit / compartment / watchspace / watertight section
- Received LA class schematic from Jason (spreadsheet with grid references)
- Translated schematic cell-by-cell to layout spec:
  - WTS 1 (Forward): 4 columns × 3 decks = 12 compartments, 10 watchspaces + battery
  - WTS 2 (Reactor): RC tunnel + reactor (2 watchspaces)
  - WTS 3 (Engineering): main engineering (multi-deck open) + maneuvering + elec dist + machinery (4 watchspaces)
- Confirmed 688 vs 688i naming: 688 = Flight I (no VLS), 688i = Improved (USS Providence, first with VLS)
- Logged D008 (variable compartment count) and D009 (tube swap restriction)

### Key decisions
- Real submarines have 2-3 watertight bulkheads, not 6 — the entire compartment model changes
- Jason provides schematics as spreadsheet images with grid references — Claude translates to layout spec
- Each submarine done individually (schematics take significant time to prepare)
- German crew names with English role abbreviations for Type 209
- Crew sizes are real numbers (130, 130, 116, 140, 35)

### How the schematic communication works
Jason creates a spreadsheet drawing of the submarine's internal layout with column/row references visible. The grid defines:
- **Watertight bulkheads** as vertical dividers between sections
- **Rooms** as labelled rectangular areas within sections
- **External equipment** outside the pressure hull boundary
- **Decks** as horizontal layers

Claude reads the image, maps rooms to grid coordinates, and translates into the `ROOMS` data structure with `section`, `deck`, `col`, `colSpan` properties. Jason confirms the translation.

---

## Session 2 — 2026-03-20/21: Phase 1 Implementation

### What was done
- Split `vessels.js`: `688i` → `688` (Flight I, no VLS, torpStock=26) + `688i` (USS Providence, VLS)
- Created vessel layout module:
  - `vessel-layouts/layout-688.js` — 3 WTS, 16 watchspaces, 21+ systems
  - `vessel-layouts/layout-legacy.js` — 6 WTS compatibility shim
  - `vessel-layouts/index.js` — `getLayout(vesselKey)` dispatcher
- Refactored `damage-data.js` — all vessel-specific data loaded via `setLayout(vesselKey)` with ES6 `let` bindings
- Replaced all hardcoded `6` compartment iterations across render-dc.js, render-damage-screen.js, render-endscreen.js, damage/index.js
- Created 688 DC panel outline (`render/outlines/outline-688.js`) with pressure hull, propshaft, bow array, VLS
- Wired `setLayout()` call into vessel selection in render-start.js

### Problems encountered and solutions

**Problem: DC panel showed legacy 6-WTS layout despite setLayout being called**
- Root cause: The `DMG` export object in `damage/index.js` used static property assignment (`COMPS: COMPS`) which captured the value at module creation time
- Fix: Converted all vessel-specific properties to JavaScript getters (`get COMPS(){ return COMPS; }`) so they always return the current live binding value
- This was a critical bug — without getters, every consumer of `DMG.COMPS` saw stale data

**Problem: Game crashed on start with 688 — initDamage used hardcoded compartment keys**
- `strikes`, `flooded`, `floodRate`, `flooding` objects hardcoded `{fore_ends:0, control_room:0, ...}`
- DC team home locations hardcoded to `'aux_section_d0b'` and `'engine_room_d0'`
- Med team locations hardcoded to `'control_room'`
- Fix: All replaced with dynamic COMPS-based construction

**Problem: Systems in engineering showed OFFLINE at mission start (no damage)**
- Root cause: `effectiveState()` checked if section had zero fit crew → offline
- Crew manifest mapped all legacy crew to `COMPS[0]` ('forward') when keys didn't match
- Engineering and reactor had 0 crew → all systems offline
- Fix: Added `_LEGACY_MAP` in crew-roster.js mapping legacy comp keys to 688 keys (fore_ends→forward, engine_room→engineering, etc.)

**Problem: Dev panel clicking triggered phantom room selections on canvas**
- Global `addEventListener("mousedown")` on window caught dev panel DOM clicks
- Canvas button registry received the coordinates and matched transparent room block buttons
- Fix: Added `e.target.closest('#dev-panel')` guard to skip canvas handling for dev panel clicks

---

## Session 3 — 2026-03-21: DC Panel Overhaul & Fire System

### Systems in watchspace room blocks
- Moved system labels from separate grid below hull into each room block
- Multi-column layout when systems exceed available height
- Removed old systems grid from both render-dc.js and render-damage-screen.js
- System labels colour-coded by status (green/yellow/orange/red)

### Clickable watchspace detail panel
- Click any room block → blue highlight + detail panel below hull
- Shows: room name + section, status (nominal/fire/flooding/flooded/drenched), crew stats, all systems with status
- DC team dispatch/recall buttons in the detail panel — player can override automated DC dispatch
- Click again to deselect

### Room grid orientation fix
- COMP_LAYOUT entries were backwards — column 0 was aft but rendered on the left (bow side)
- Flipped forward compartment: c:0 = Computer Room (bow), c:3 = Comms (aft)
- Flipped engineering: c:0 = Maneuvering (reactor side), c:1-2 = Engineering main (stern side)

### Fire system overhaul

**Fire spread was broken — random rooms catching fire across the section**
- Root cause: ROOM_ADJ only checked deck proximity, not horizontal position
- With 10 rooms in WTS 1 all within 1 deck of each other, everything was "adjacent"
- Fix: Added `col`/`colSpan` to room definitions. Adjacency now requires both deck proximity AND column overlap/touching (D010)

**Torpedo hit damaged all systems in section**
- Old code: `activeSystems(comp)` returned all systems in the WTS, hit damaged a random subset
- Fix: Pick random impact room (weighted to lower decks), damage only systems in that room + ROOM_ADJ neighbours (D011)

**Fire heat damage never applied — systems snapped back to nominal after fire**
- Root cause 1: Heat damage code was inside the "detected fire" branch, skipped by `continue` for undetected fires. Unmanned rooms burned to 80% without any system damage.
- Root cause 2: Even for detected fires, heat damage was probabilistic with very low chance (~0.75% per second at 80% fire). Fires often extinguished without a single damage event.
- Root cause 3: Systems appeared offline during fire (effectiveState unmanned check) masking that no real damage occurred
- Fix: (a) Moved heat damage to separate loop running for ALL burning rooms regardless of detection. (b) Changed from probabilistic to accumulator-based — guaranteed damage every ~10s at 80% fire. (c) effectiveState now checks per-room habitability not per-section crew count.

**Fire in rooms without systems had no consequences**
- Crew mess, wardroom, etc. have no systems — fire burned freely but damaged nothing
- Fix: When a burning room has no systems in ROOM_SYSTEMS, heat radiates to adjacent rooms and damages their systems

**Fire growth/spread tuning**
- Base growth: 0.008 → 0.014 (~75% faster)
- Scale growth: 0.022 → 0.036 (~64% faster)
- Spread threshold: 30% → 20%, chance multiplier tripled
- DC suppression stall point: ~100% → ~80% (DC_FIRE_SUPPRESS 0.045→0.043)

**WTD burn-through mechanic**
- Old: fire spread through open WTDs at 85% intensity (too easy)
- New: fire must sustain 100% for 60 seconds to burn through a bulkhead
- Burn-through damages WTD system (destroyed), forces door open, ignites fire in adjacent section
- WTD is now a repairable system in SYS_DEF (D012)

**Fire fog of war**
- Undetected fires now hidden from DC panel entirely (no fire overlay, no percentage)
- Sensor alarm at 40% → pulsing amber "ALARM" indicator on room block
- 12-second investigation delay before fire confirmed and fully visible
- False alarm system: ~0.8% chance per unmanned room per 10-second check cycle
- False alarms trigger same investigation process, resolve as "false alarm" with comms message

### Section-wide colour overlay removed
- Old: entire WTS coloured based on worst system state (deep red when one system destroyed)
- Misleading with 3 large sections — one destroyed system painted the whole forward compartment red
- Removed from both render-dc.js and render-damage-screen.js

### Dev panel rewired
- All hardcoded compartment arrays (COMPS, SYS_LIST, ROOM_DEFS, WTD_LABELS) replaced with dynamic reads from DMG module
- Flood buttons, fire room buttons, systems rows, WTD toggles all rebuild when layout changes
- Damage state readout uses dynamic compartment keys and WTD pairs

---

## Session 4 — 2026-03-21: Phase 2 (Magazine Rack)

### What was done
- Added `magazineRack` property to all vessels in vessels.js
- Fixed `torpStock` initialisation: now = rack contents only (magazineRack - missileStock), since tubes start loaded
- Added rack-full checks to `_orderStrikeReload` and `_orderUnload`: "Magazine full — cannot swap/unload"
- Logged D013

### Values
| Vessel | Tubes | Rack | Total | Missiles in rack |
|--------|-------|------|-------|-----------------|
| 688 | 4 | 22 | 26 | 8 Harpoon |
| 688i | 4 | 22 | 26 | 8 Harpoon (+ 12 TASM in external VLS) |
| Trafalgar | 5 | 20 | 25 | 6 Sub-Harpoon |
| Swiftsure | 5 | 15 | 20 | 6 Sub-Harpoon |
| Seawolf | 8 | 42 | 50 | 8 Harpoon |
| Type 209 | 8 | 6 | 14 | 4 SM39 Exocet |

---

## Session 5 — 2026-03-21: Documentation Restructure

- Split docs into `migration/` (archived, complete) and `vessel-individuality/` (active)
- Constitution (manual.md) and CLAUDE.md remain global
- Created comprehensive session log, separate decisions log
- Updated CLAUDE.md to reference new structure

---

## Session 6 — 2026-03-21: Phase 3 (Pre-Mission Loadout Screen)

### What was done
- Added `loadout` phase to `ui.startPhase` (scenario → vessel → **loadout** → mission)
- Added `session.loadout` state: `{ rack: { weaponKey: count, ... }, tubes: [weaponKey, ...], vls: weaponKey }`
- Built loadout screen UI in render-start.js:
  - **Magazine Rack** section (left column): +/- buttons for each valid weapon type, total must equal rack capacity
  - **Torpedo Tubes** section (right column): click to cycle each tube through valid weapon options
  - **VLS** section (right column, if applicable): shows VLS weapon and cell count (read-only for now)
  - DIVE button disabled until rack is exactly full (slots remaining / over capacity warning)
  - Back button returns to vessel selection
- Wired loadout into `sim/index.js reset()`: rack contents and tube pre-loads applied from `session.loadout`
- Default loadout generated automatically when entering loadout screen (all torpedoes + default missile allocation)

### How it works
1. Player selects vessel → clicks DIVE → vessel preset merged into CONFIG.player, layout loaded
2. Default loadout generated: rack filled with torpedoes minus default missiles, all tubes loaded with primary torpedo
3. Loadout screen renders: player adjusts rack mix and tube pre-loads
4. Player clicks DIVE (only active when rack slots = rack capacity) → `resetScenario()` called
5. `reset()` reads `session.loadout` and applies rack contents to `torpStock`/`missileStock` and tube loads to `tubeLoad[]`

### Valid weapon types per vessel
- Rack weapons: vessel's primary torpedo + all `missileTypes` (tube-launched missiles only)
- Tube weapons: same list (torpedo + tube-launched missiles). Click cycles through options.
- VLS: fixed per vessel config (`vlsWeapon`). Modelled in UI but no options to change yet.

### Weapon loadout expansion (same session)
Added full LA class weapon roster. All tube-launchable weapons available on loadout screen.

**688 (Flight I) tube weapons:** MK-48 ADCAP, Harpoon, TASM, TLAM, SUBROC, SLMM mine, CAPTOR mine
**688i (Improved) tube weapons:** MK-48 ADCAP, TASM, TLAM, SUBROC, SLMM mine, CAPTOR mine (Harpoon phased out)
**688i VLS:** 12 x TASM (fixed)

Placeholder weapons added to `constants.js` with `placeholder: true`:
- `tlam` — BGM-109 TLAM (land-attack, no anti-ship seeker, not yet functional)
- `subroc` — UUM-44 SUBROC (nuclear depth bomb, not yet functional)
- `mk67_slmm` — MK-67 SLMM (submarine-launched mobile mine, not yet functional)
- `mk60_captor` — MK-60 CAPTOR (encapsulated torpedo mine, not yet functional)

TASM corrected: now tube-launchable (`tubeLaunch: true`) as well as VLS-capable. Label corrected to BGM-109B.
Harpoon label corrected to UGM-84.

---

## Session 7 — 2026-03-21: Phase 4 (Remaining Vessel Layouts) + Bug Fixes

### Layouts implemented
- **Trafalgar/Swiftsure** (`layout-trafalgar.js`): 3 WTS, 3 decks + battery. Combined Control/Sonar Room. Wardroom spans 2 decks. 10 watchspaces + battery in forward.
- **Seawolf** (`layout-seawolf.js`): 3 WTS, **4 decks** + battery. Largest submarine. Expanded reactor section with 4 watchspaces (RC Computer Control, RC Tunnel, Reactor Support, Reactor Compartment). Torpedo room spans 3 compartments × 2 decks. Condenser as separate watchspace in engineering.
- **Type 209** (`layout-type209.js`): 3 WTS, **2 decks** (upper full-height, lower half-height for batteries). No reactor. Batteries are full-sized compartments across the lower deck (6 separate battery bank watchspaces). Section keys: `forward/midships/aft` (different from all other subs).

All 6 submarines now have real schematic-based layouts. The legacy 6-WTS shim (`layout-legacy.js`) is no longer used by any vessel.

### Condenser system
Added `condenser` system to all nuclear submarines:
- Seawolf: own dedicated watchspace (`eng_condenser`)
- 688/688i and Trafalgar/Swiftsure: added to the Engineering main watchspace (`eng_main`)

### Dynamic deck count
The damage screen now handles 2, 3, or 4 decks dynamically:
- `numDecks` computed from room data (checks if any non-battery room exists at deck 3)
- `deckHeights` supports non-uniform deck heights via layout's `DECK_HEIGHTS` property (Type 209: `[2,1]` = upper deck twice the height of lower)
- `deckTops` computed from cumulative deck heights
- All hardcoded `di<3`, `deckTops[2]+dH`, `d1Top/d2Top/d3Top` references replaced with dynamic equivalents
- `deckFloodFrac` generalised for any number of decks
- Deck line rendering handles multi-deck rooms correctly (draws line segments around spanning rooms)

### Weapon system fixes

**`isTorpLoad()` helper (D014):**
All 15 hardcoded `==='torp'` / `!=='torp'` checks across 4 files replaced with `isTorpLoad(key)` from constants.js. This function checks `CONFIG.weapons[key].kind==='torpedo'` so actual weapon keys (`'mk48_adcap'`, `'sst4'`, etc.) are correctly recognised as torpedoes.

**Firing no longer checks/decrements rack stock (D015):**
`reserveTube()` and `reserveSpecificTube()` no longer check `torpStock > 0` or decrement it on fire. The torpedo is already in the tube — rack stock is irrelevant for firing. `torpStock` is only consumed on reload (via `_orderLoad`).

### Problems encountered and solutions

**Problem: Deck line missing between upper and mid deck on Trafalgar (Wardroom spans 2 decks)**
- Old code: if ANY room in the section spanned a deck boundary, the entire line was skipped
- Fix: draw line in segments, skipping only the columns where a multi-deck room exists

**Problem: Reactor section showed extra empty column (Seawolf)**
- `getCompCols()` had `Math.max(3, ...)` — minimum 3 columns even for 2-column sections
- Fix: changed to `Math.max(1, ...)`

**Problem: Type 209 triggered flooding and system damage on spawn**
- Root cause: `setLayout()` was called on the loadout screen entry, changing the active damage layout while the game loop was still running the previous session. The Type 209's `crewTotal=35` with the old session's crew distribution caused `integ=0` in effects.js → `maxDepth=72m` → depth cascade triggered at 190m
- Fix: moved `setLayout()` from loadout screen entry to mission start (DIVE button from loadout). The loadout screen reads weapon config from `CONFIG.player` (merged early) but doesn't touch the damage layout.

**Problem: Type 209 spawned at diving limit (250m) instead of safe depth**
- `spawnDepth = Math.min(260, divingLimit)` put the 209 at 250m, right at its limit
- Fix: `spawnDepth = Math.min(260, safeDivingDepth || divingLimit)` — spawns at 190m

**Problem: Forward planes comms fired spuriously on init (all vessels)**
- `effectiveState` oscillated on first frames due to init race → planes mode toggled → comms fired
- Fix: 2-second comms guard on planes mode transitions (`session.missionT > 2.0`). Physics still work immediately, just the comms are suppressed.

**Problem: All submarines showed missiles in tubes regardless of loadout**
- `reserveTube()` and `reserveSpecificTube()` checked `tubeLoad[i]==='torp'` — but actual weapon keys like `'mk48_adcap'` failed this check, making loaded torpedo tubes appear as missile tubes
- Fix: `isTorpLoad()` helper (see above)

**Problem: Firing 2 torpedoes emptied all tubes and rack**
- `reserveTube()` checked `torpStock > 0` before allowing fire AND decremented `torpStock` on fire
- With rack-only `torpStock` (Type 209: only 2 torpedoes on rack), firing 2 emptied the rack, then remaining loaded tubes couldn't fire because `torpStock <= 0`
- Fix: firing a loaded tube no longer touches `torpStock`. Rack is only consumed on reload.

### Crew mapping for Type 209
Added dynamic override in `_LEGACY_MAP` when `COMPS` includes `midships`: `control_room→midships`, `engine_room→aft`, `reactor_comp→aft`. Also added `midships` and `aft` to OR-checks in `damage/index.js` for hit logic.

### Weapon tooltips
Added hover tooltips to loadout screen showing weapon role, description, and stats (speed, range, damage, seeker range, max launch depth). Placeholder weapons show `[NYI]` tag and dimmer colour.

### All vessel loadouts updated from Jason's LOADOUTS.md
See Session 6 for weapon roster per vessel.

---

## Session 8 — 2026-03-21: Phase 5 (Nation-Specific Communications)

### Open questions resolved
- Type 209: 2 DC teams (confirmed by Jason)
- Pre-mission loadout: additional step after vessel selection (confirmed, works fine)

### Terminology module (`src/narrative/terminology.js`)
New module provides nation-keyed terminology lookup via `T(key)` function. Reads `CONFIG.player.nation` at runtime to return the correct term for the active vessel's navy.

**Key terminology differences implemented:**

| Term | USN | RN | DE |
|------|-----|----|----|
| Watch officer | OOD | OOW | WO |
| Action stations | Battle stations | Action stations | Combat stations |
| Torpedo away | TORPEDO AWAY | TORPEDO GONE | TORPEDO RUNNING |
| Emergency blow | EMERGENCY BLOW | EMERGENCY BLOW | BLOW ALL TANKS |
| Silent running | ULTRA-QUIET | SILENT RUNNING | SILENT ROUTINE |
| Acknowledgement | aye | aye | acknowledged |
| Conn label | CONN | CONN | CTRL |
| Eng label | ENG | ENG | MACH |
| Weps label | WEPS | WEPS | TORP |
| Addressing | Conn, Sonar | Conn, Sonar | Control, Sonar |

DE style: German-flavoured English — clipped, direct, functional. No literal German commands. "Acknowledged" instead of "aye". "Control" instead of "Conn". Shorter, more precise phrasing.

### Nation-specific crew manifests
Three separate crew manifests created:

**RN (`CREW_MANIFEST_RN` — inline in crew-roster.js):**
- 90 named crew, British names, RN ratings (CDR, LCDR, LT, WO, CPO, PO, LS, AB)
- Roles: OOW, SON CTL, PLNSMN, HELSMN, MRWO, COW(T), 1ST LT, COX'N
- Used by: Trafalgar, Swiftsure

**USN (`crew-manifest-usn.js`):**
- 90 named crew, American names, USN ratings (CDR, LCDR, LT, LTJG, CPO, PO1-PO3, SN)
- Roles: OOD, DO, COW, FTOW, SONAR SUP, QMOW, EOOW, THROT, TRS, RADIO SUP
- Used by: 688, 688i, Seawolf

**DE (`crew-manifest-de.js`):**
- 35 named crew, German names, Deutsche Marine ratings (KptLt, OLtzS, LtzS, OBtsm, Btsm, Maat, OGfr, HGfr)
- Roles: KDT, IWO, WO, LI, OSTM, ZM, SONM, TORM, MASM, EMAT, FUNK, SANM, RUDG
- Used by: Type 209

### Crew roster selection
`crew-roster.js` updated to select manifest by `nation()`:
- `_activeManifest()` returns USN/DE/RN manifest based on current vessel nation
- `_DEPT_BY_ROLE` expanded with USN and DE role→department mappings
- `buildCrewManifest()` uses `_activeManifest()` instead of hardcoded `CREW_MANIFEST`

### Voice templates updated (voice.js, voice-ops.js)
All ~200 voice templates converted from hardcoded strings to nation-aware terminology:
- Station labels: `log('CONN', ...)` → `log(T('stConn'), ...)`
- Addressing: `'Conn, Sonar'` → `T('connSonar')`
- Key phrases: `'TORPEDO AWAY'` → `T('torpedoAway')`
- Acknowledgements: `'aye'` → `T('aye')`

### Crew state transitions (comms.js)
`crewState` object fully converted:
- `actionStations()` uses `T('actionStations3x')` for the 3× repeat
- `emergencyStations()` uses `T('emergencyStations3x')`
- `escapeStations()` uses `T('escapeStations3x')`
- `standDown()` uses `T('standDown')`
- All station labels dynamic

### Watch handover (voice-ops.js)
- `watch.requestRelief()` uses `T('oow')` for the watch officer title
- `watch.onWatch()` uses `T('oowFull')` and `T('assumedWatch')`
- `watch.blocked()` uses `T('actionStations')` for the blocked reason

### OOW role lookup (player-physics.js)
- `_oowName()` now searches for any of `['OOW','OOD','WO']` roles instead of hardcoded `'OOW'`
- Searches all compartments (`COMPS`) instead of just `'control_room'`
- Added `COMPS` import from `damage-data.js`

### Files created
| File | Purpose |
|------|---------|
| `src/narrative/terminology.js` | Nation-keyed terminology lookup module |
| `src/systems/damage/crew-manifest-usn.js` | USN crew manifest (90 named, American names) |
| `src/systems/damage/crew-manifest-de.js` | DE crew manifest (35 named, German names) |

### Files modified
| File | Changes |
|------|---------|
| `src/systems/damage/crew-roster.js` | Per-nation manifest selection, expanded dept mappings |
| `src/narrative/comms.js` | Nation-aware station labels, crewState templates |
| `src/narrative/voice.js` | All templates converted to T() lookups |
| `src/narrative/voice-ops.js` | All templates converted to T() lookups |
| `src/sim/player-physics.js` | Multi-role OOW lookup, COMPS import |
| `docs/vessel-individuality/DESIGN.md` | Open questions 1, 2-5, 8 resolved |

### Build status
Clean build (Vite production + dev server). No import errors.

---

## Session 9 — 2026-03-21: Phase 6 (Propulsion Character)

### Scope decisions
- **Escape systems:** Deferred — needs its own rework, more associated with end-of-game mechanics
- **Atmospheric casualties:** Already exist (hydrogen buildup, chlorine gas). The support *systems* (O2 gen, CO2 scrubbers, vent plant) already exist as damageable systems in all layouts. No new systems needed.
- **Phase 6 narrowed to:** Per-vessel propulsion character differences

### Per-vessel propulsion properties (D017)
Added `accelTau` and `decelTau` to all vessel definitions in `vessels.js`. The old single `speedTau` with `tauScale = 28 / flankKts` scaling is replaced — per-vessel values already capture vessel size and plant power.

**Speed convergence in `nav.js stepDynamics()`:**
- Detects acceleration vs deceleration: `Math.abs(orderSigned) > Math.abs(currentSigned) + 0.5`
- Accelerating → uses `C.player.accelTau`
- Decelerating → uses `C.player.decelTau`
- Damage multipliers (conn room lost ×4, flood drag) apply on top

**Per-vessel turn rate:**
- `turnRateDeg` already read from `C.player.turnRateDeg` in nav.js — no code change needed
- Per-vessel overrides added to vessels.js

**Values:**

| Vessel | accelTau | decelTau | turnRateDeg | Character |
|--------|----------|----------|-------------|-----------|
| 688 | 45s | 30s | 2.2°/s | Baseline workhorse |
| 688i | 45s | 30s | 2.2°/s | Identical to 688 |
| Trafalgar | 40s | 25s | 2.0°/s | Pump-jet: smoother, faster response |
| Swiftsure | 50s | 35s | 2.0°/s | Older plant, sluggish |
| Seawolf | 35s | 25s | 1.8°/s | Most powerful, but largest hull |
| Type 209 | 60s | 20s | 2.8°/s | Slow accel, fast braking, tightest turns |

### Files modified
| File | Changes |
|------|---------|
| `src/config/vessels.js` | Added `accelTau`, `decelTau` to shared defaults and per-vessel overrides |
| `src/systems/nav.js` | Speed convergence uses accel/decel tau based on direction; removed flankKts scaling |
| `docs/vessel-individuality/DECISIONS.md` | D017 logged |

### Build status
Clean build (Vite production). No errors.

---

## Session 10 — 2026-03-21: Phase 7 (Volume-Based Flooding & Balance)

### Volume measurement system documented
Added Chapter 13.1C to manual.md defining the hull volume hierarchy:
- **Unit** = 1 schematic grid cell
- **Compartment** = 2×4 = 8 units (base volume measure)
- **Watchspace** = 1+ compartments
- **Watertight section** = 1+ watchspaces

### Volume added to all layouts
`volume` property (in compartments) added to each `COMP_DEF` entry:

| Vessel | Forward | Reactor/Mid | Engineering/Aft |
|--------|---------|-------------|-----------------|
| 688/688i | 12 | 3 | 8 |
| Trafalgar/Swiftsure | 12 | 3 | 8 |
| Seawolf | 22 | 8 | 14 |
| Type 209 | 4 | 5 | 5 |
| Legacy (6-WTS) | 4 each | 3 (reactor) | 4 each |

### Flooding audit findings and fixes (D018)

**Issue 1 — Flood rates ignored section size (HIGH)**
All sections flooded at identical rates regardless of volume. A 3-compartment reactor took the same time to flood as a 12-compartment forward section.

**Fix:** `index.js` flood tick multiplies breach rate by `volScale = 8 / volume`. Reactor (3 comps) now fills 2.67× faster. Forward (12 comps) fills 0.67× slower. Bilge pump drain scaled identically.

**Issue 2 — Buoyancy calculation treated all sections equally (MEDIUM)**
Forward at 100% flooded added the same buoyancy penalty as reactor at 100%, despite being 4× the volume.

**Fix:** `effects.js getTrimState()` now weights flooding by `volume / 8`. Forward flooding contributes 1.5× buoyancy, reactor only 0.375×. Trim levers also weighted by volume.

**Issue 3 — DC suppression rate ignored section size (HIGH)**
DC teams suppressed at a fixed 0.055/s regardless of section. Same effectiveness in a massive forward compartment as a tiny reactor.

**Fix:** `dc-teams.js` scales suppression by `8 / volume`. DC teams are 2.67× more effective in reactor (seal breach almost instantly) but only 0.67× effective in forward (struggle with large-section floods).

**Items not addressed (deferred or intentional):**
- Fire spread asymmetry (room-based, naturally scales with geometry — intentional)
- Crew casualty density scaling (deferred — separate casualty rework)
- Sinking check logic (functional, minor fragility)

### Files modified
| File | Changes |
|------|---------|
| `manual.md` | Chapter 13.1C — hull volume measurement system |
| `src/config/vessel-layouts/layout-688.js` | `volume` added to COMP_DEF |
| `src/config/vessel-layouts/layout-trafalgar.js` | `volume` added to COMP_DEF |
| `src/config/vessel-layouts/layout-seawolf.js` | `volume` added to COMP_DEF |
| `src/config/vessel-layouts/layout-type209.js` | `volume` added to COMP_DEF |
| `src/config/vessel-layouts/layout-legacy.js` | `volume` added to COMP_DEF |
| `src/systems/damage/index.js` | Flood rate and bilge drain scaled by volume |
| `src/systems/damage/effects.js` | Buoyancy and trim weighted by volume |
| `src/systems/damage/dc-teams.js` | DC suppression scaled by volume |
| `docs/vessel-individuality/DECISIONS.md` | D018 logged |

### Build status
Clean build (Vite production). No errors.

---

## Session 11 — 2026-03-21: Per-Room Flooding Rewrite (D019)

### Architecture change
Flooding refactored from per-section to per-room, mirroring the fire system. Water fills individual rooms and spreads via `ROOM_ADJ` adjacency — same system fires use.

### Data structures added
- `d.roomFlood[roomId]` — 0-1 flood level per room
- `d.roomFloodRate[roomId]` — breach ingress rate per room
- `d.flooding[comp]` — now aggregated from room floods (weighted by colSpan)

### Breach assignment
- First hit: `roomFloodRate[impactRoom] = severity × 0.04` (~25s per room at surface)
- Second hit: new room, `roomFloodRate = 0.15 + severity × 0.15` (catastrophic)

### Spread mechanics
- **Downward:** Automatic (gravity). No chance roll. Rate ∝ source flood level.
- **Horizontal:** Very high chance — `(flood - 0.10) × 0.10 × dt` (~10× fire spread)
- **Upward:** Only when source >85%. Very low chance.
- **Cross-WTD:** Unchanged (section-level via `_wtdFloodSpread`)

### Per-room system damage
Room systems damaged at 80% room flood. Replaces old 33%/67% section deck thresholds.

### DC teams updated
Target worst breached room in section. Suppress `roomFloodRate` at that room. Move to next breach when sealed.

### Section aggregation
`flooding[comp] = Σ(roomFlood × colSpan) / Σ(colSpan)` — weighted average. Drives all section-level thresholds (evacuation 65%, sinking 100%, buoyancy, trim) unchanged.

### Files modified
| File | Changes |
|------|---------|
| `src/systems/damage/index.js` | Per-room flood init, room-level breach, rewritten tick, spread, aggregation |
| `src/systems/damage/dc-teams.js` | Room-targeted flood fighting |
| `docs/vessel-individuality/DECISIONS.md` | D019 logged |

### Bugs fixed during testing

**Medics dying on spawn (all non-RN vessels):**
`medTeam` in `initDamage` was hardcoded with RN crew IDs (`oconnor`, `hayes`). USN (`morales`, `collins`) and DE (`baumann`) IDs didn't exist → both medics marked as lost on frame 1. Fixed: crew manifest built first, med team dynamically constructed from medical department crew.

**Section-level flooding overriding per-room (three root causes):**
1. `hit()` still set `d.floodRate[comp]` alongside room rate — removed
2. `_wtdFloodSpread()` directly advanced `d.flooding[comp]` — changed to spread into rooms
3. `applyDepthCascade()` set section-level seep rate — changed to per-room
4. `d.floodRate[comp]` now derived from max room rate each tick

**WTD spread too aggressive:**
Threshold raised from 5% to 25% section flooding. Rate reduced from 0.12/s to 0.04/s. Differential threshold raised from 5% to 10%.

**Crew panel "undefined" section headers:**
`COMP_LABELS2` only had legacy 6-WTS keys. Added `forward`, `reactor`, `engineering`, `midships`, `aft`.

**Flood overlay invisible at low levels:**
Alpha was `roomFl × 0.55` — at 5% flood, alpha was 0.028 (invisible). Fixed: minimum 20% alpha, minimum 8% visual height, percentage text shown above 5%.

**Rooms capping at 51% flood (spread equilibrium bug):**
Horizontal spread was one-shot initiation (set target to 5% then stop). Bilge pumps fought the trickle, creating equilibrium. Fixed: continuous differential flow between all adjacent rooms. Bilge pumps only drain rooms without active breach.

**Flooding too fast / overwhelming crew:**
- Breach rate halved: `severity × 0.02` (was 0.04) — ~50s per room at surface
- Second hit rate reduced: `0.06 + severity × 0.06` (was 0.15 + 0.15)
- Spread rates reduced: downward 0.08 (was 0.25), horizontal 0.06 (was 0.18)
- Manned room resistance: each fit crewmember reduces flow by 15% (max 90%)
- Bilge pumps per-room: base 0.004/s + 0.002/s per crew

**DC teams not responding to flooding:**
1. `_bestDCTarget` checked section-level `floodRate` — added per-room `roomFloodRate` check
2. `_bestArrivalRoom` only checked for fire — now prioritises breached room
3. Dev panel flood buttons didn't set `casualtyState` — added `setCasualtyState('emergency')`

**No flood comms:**
Per-room flood detection comms added. When any room crosses 3% flood, bilge alarm fires immediately (no investigation delay — flooding is always detectable). First room in section triggers full emergency: flooding alarm, emergency stations, WTD close, DC muster.

### Files modified (complete list for session 11)
| File | Changes |
|------|---------|
| `src/systems/damage/index.js` | Per-room flood init, room breach in hit(), rewritten tick with differential flow, crew resistance, per-room system damage, flood detection comms, dynamic medTeam |
| `src/systems/damage/dc-teams.js` | Room-targeted flood fighting, per-room breach detection in `_bestDCTarget`, `_bestArrivalRoom` prioritises breached room |
| `src/systems/damage/flooding.js` | WTD spread to rooms not sections, reduced spread thresholds/rates, `sealFlooding` clears per-room data, `applyDepthCascade` uses per-room rate |
| `src/systems/damage/effects.js` | Buoyancy weighted by section volume |
| `src/render/panels/render-damage-screen.js` | Per-room flood overlay with percentage text, removed section-level flood band, fixed COMP_LABELS2, room visibility check |
| `src/dev-panel.js` | Per-room flood buttons, flood clear includes room data, emergency state on flood |
| `docs/vessel-individuality/DECISIONS.md` | D019 logged |

### Build status
Clean build (Vite production). No errors.
