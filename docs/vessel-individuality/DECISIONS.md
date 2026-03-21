# Vessel Individuality — Decisions Log

Architectural and design decisions made during the vessel individuality upgrade. Recorded so they are not re-argued in future sessions.

---

## D008 — Variable compartment count based on real schematics

**Decision:** The game supports a variable number of watertight sections per vessel class, based on real submarine schematics. The original 6-WTS model is replaced entirely. The LA class has 3 WTS. Other classes TBD from schematics. All code that iterates over compartments uses `COMPS.length` rather than hardcoding `6`.

**Why:** Real watertight bulkheads are massive full-pressure-rated structural members. Submarines typically have only 2-3 of them. The 6-WTS model dramatically overstated compartmentalisation. Using real schematics produces authentic layouts where a single WTS (e.g. the LA class forward compartment) contains torpedo room, control room, sonar, comms, crew messes, and auxiliary machinery. Flooding a section is catastrophic — which is realistic.

**How to apply:** All `for(let ci=0;ci<6;ci++)` loops became `for(let ci=0;ci<COMPS.length;ci++)`. DC panel, flooding, fire spread, crew evacuation, travel time table, and WTD definitions all read from the active vessel's layout data. External equipment (bow array, VLS, propshaft) is tracked separately from internal compartments. Legacy vessels use a 6-WTS compatibility shim (`layout-legacy.js`) until they receive real schematics.

---

## D009 — Magazine rack and tube swap restriction

**Decision:** Torpedo tubes are tracked individually (empty / loading / loaded with weapon type). The magazine rack has a fixed capacity separate from tube count. Weapons can only be unloaded from a tube if there is a free rack slot. If all rack slots are occupied, the tube loadout is locked until a weapon is fired.

**Why:** Realistic — a submarine physically cannot remove a torpedo from a tube if there is no space on the loading rack to receive it. Creates meaningful tactical decisions about weapon loadout before engagement, particularly on the Type 209 (8 tubes, only 6 rack slots = zero swap flexibility at full load).

**How to apply:** `vessels.js` has `magazineRack` per vessel. `torpStock` represents rack contents only (not tube contents). `_orderStrikeReload()` and `_orderUnload()` check `torpStock + missileStock >= magazineRack` before allowing the operation.

---

## D010 — Room adjacency uses spatial position (col/colSpan), not just deck

**Decision:** ROOM_ADJ computes adjacency using both deck AND column position. Two rooms are adjacent only if they're in the same section and physically touching — same deck with touching column ranges, or adjacent decks with overlapping column ranges.

**Why:** With 3 large WTS sections, deck-only adjacency made every room in a section "adjacent" to every other room on the same or adjacent deck. Fire spread from diesel engines directly to torpedo room (opposite end of the forward compartment).

**How to apply:** Layout files include `col` and `colSpan` on each room definition. Legacy layouts without these fall back to deck-only adjacency. The adjacency builder uses `_colsTouch()` for same-deck and `_colsOverlap()` for adjacent-deck checks.

**Bug this fixed:** Fire in diesel engine room spreading to torpedo room and wardroom (not physically adjacent).

---

## D011 — Fire/hit damage localised to watchspace level, not section level

**Decision:** Three systems that previously operated at section (WTS) level are now localised to the watchspace (room) level:
1. **Torpedo hit damage** — systems damaged only in impact room + adjacent rooms, not entire section
2. **Fire heat damage** — accumulator-based, only damages systems in the burning room (radiates to adjacent rooms if source room has no systems)
3. **effectiveState unmanned check** — systems only go offline if their specific room is uninhabitable (fire>50%, flooded, drenched), not if crew evacuated from elsewhere in the section

**Why:** With 3 WTS, a single section contains 10+ watchspaces and 20+ systems. Section-wide damage from a localised event was devastating and unrealistic.

**How to apply:** Hit damage uses `ROOM_SYSTEMS` + `ROOM_ADJ` blast radius. Fire heat uses `_fireHeatAccum` per-room accumulator (guaranteed damage, not probabilistic). `effectiveState` checks the specific room's state, with a fallback to section-level only when all crew are killed (not just displaced).

**Bugs this fixed:**
- Torpedo hit to forward compartment damaging all 21 systems instead of 2-3 near impact
- Fire in crew mess taking control room systems offline (crew evacuation made entire section "unmanned")
- Systems snapping back to nominal when fire extinguished (they were never actually damaged, just appearing offline from crew displacement)

---

## D012 — WTDs are systems; fire burns through bulkheads; undetected fires hidden from DC panel

**Decision:** Three new mechanics:
1. **WTDs as systems** — Each watertight door is a damageable system in SYS_DEF with `isWTD:true` and `wtdKey`. Standard 4-state damage model. Offline/destroyed WTDs cannot be operated.
2. **Bulkhead burn-through** — Fire can only cross a WTD after sustaining 100% intensity for 60 seconds. On burn-through, WTD system set to destroyed, door forced open. Replaces old open-door cascade.
3. **Fire fog of war** — Fires in unmanned rooms invisible on DC panel until watchkeeper investigates and confirms. Sensor alarms show as pulsing amber "ALARM" indicators. False fire alarms occur randomly in unmanned rooms.

**Why:** (1) WTDs need to be repairable after fire damage. (2) Fire spreading through open doors was too easy — real fires take sustained extreme heat to compromise a pressure-rated bulkhead. (3) Player shouldn't have perfect information about undetected fires.

**How to apply:** WTD systems defined per-layout in SYS_DEF. Burn-through tracked via `d._fireBulkheadT[wtdKey]` accumulator. Fire visibility uses `d._fireDetected[rid]` — rendering checks `_visibleFire(rid)` helper. False alarms tracked in `d._fireAlarmFalse[rid]`.

---

## D013 — Magazine rack capacity separates tube loads from stowage

**Decision:** Each vessel has a `magazineRack` property (rack slots separate from tubes). `torpStock` and `missileStock` represent rack contents only — tubes tracked via `tubeLoad[]`. At scenario start, tubes are loaded and `torpStock = magazineRack - missileStock`.

**Why:** Previous system used `torpStock` as total including tube contents, making it impossible to enforce swap restrictions. Separating the concepts allows accurate rack-full detection and future pre-mission loadout.

**How to apply:** `vessels.js` has `magazineRack` per vessel (688=22, Trafalgar=25, Swiftsure=15, Seawolf=42, Type 209=6). `reset()` sets `torpStock = magazineRack - missileStock`. Strike reload and unload check `torpStock + missileStock >= magazineRack`.

---

## D014 — isTorpLoad() replaces hardcoded 'torp' string checks

**Decision:** All weapon type checks that compared `tubeLoad` against the literal string `'torp'` are replaced with `isTorpLoad(key)` from constants.js. This function returns true for `null`, `'torp'` (legacy), and any weapon key where `CONFIG.weapons[key].kind === 'torpedo'`.

**Why:** The loadout system populates `tubeLoad[]` with actual weapon keys (e.g. `'mk48_adcap'`, `'sst4'`) instead of the generic `'torp'`. The old `!=='torp'` check treated these as missiles, causing loaded torpedo tubes to display as missile tubes, preventing firing, and breaking the tube management UI.

**How to apply:** 15 occurrences replaced across `player-control.js`, `render-command.js`, `render-tdc.js`, `panel.js`. All checks now use `isTorpLoad(key)` or `!isTorpLoad(key)`.

---

## D015 — Firing a loaded tube does not consume rack stock

**Decision:** `reserveTube()` and `reserveSpecificTube()` no longer check `torpStock > 0` or decrement it when firing. The torpedo is already in the tube — rack stock is irrelevant for the act of firing. `torpStock` is only consumed on reload (via `_orderLoad`).

**Why:** With the rack system, `torpStock` represents rack contents only (not tube contents). Checking `torpStock > 0` before firing prevented loaded tubes from firing once the rack was empty. On the Type 209 (rack=6, 8 tubes loaded), firing 2 torpedoes emptied the rack and disabled the remaining 6 loaded tubes.

**How to apply:** `reserveTube` finds a loaded torpedo tube and sets it to `-1` (wire-occupied). No `torpStock` check or decrement. `reserveSpecificTube` same. Rack stock is consumed only by `_orderLoad` when the player commands a reload.

---

## D016 — setLayout() runs at mission start, not loadout screen entry

**Decision:** `setLayout(vesselKey)` is called when the player clicks DIVE from the loadout screen (immediately before `resetScenario`), not when entering the loadout screen from vessel selection.

**Why:** Calling `setLayout` on loadout screen entry changed the active damage layout while the game loop was still running the previous session's simulation. This caused the effects system to compute incorrect values (crew count mismatch, wrong integrity, wrong collapse depth) leading to spurious flooding, system damage, and emergency events on the Type 209.

**How to apply:** The vessel preset is merged into `CONFIG.player` on loadout screen entry (needed for weapon config display), but `setLayout()` is deferred to the DIVE button handler. The game loop continues with the previous layout until the mission actually starts.

---

## D017 — Per-vessel propulsion character (accelTau, decelTau, turnRateDeg)

**Decision:** Each vessel has distinct acceleration, deceleration, and turn rate values instead of sharing a single `speedTau` scaled by flank speed. The old `tauScale = 28 / flankKts` scaling is removed — per-vessel tau values already capture vessel size and plant power.

**Values:**

| Vessel | accelTau | decelTau | turnRateDeg | Rationale |
|--------|----------|----------|-------------|-----------|
| 688 | 45s | 30s | 2.2°/s | Baseline — Cold War workhorse |
| 688i | 45s | 30s | 2.2°/s | Identical hull/plant to 688 |
| Trafalgar | 40s | 25s | 2.0°/s | Pump-jet: smoother, faster response, less rotational inertia |
| Swiftsure | 50s | 35s | 2.0°/s | Older plant, sluggish by comparison |
| Seawolf | 35s | 25s | 1.8°/s | Most powerful reactor, but largest hull = slowest turns |
| Type 209 | 60s | 20s | 2.8°/s | Diesel-electric: slow acceleration, fast electric braking, smallest/tightest boat |

**How to apply:** `nav.js stepDynamics()` selects `accelTau` when increasing speed, `decelTau` when decreasing. Turn rate reads from `C.player.turnRateDeg` (already dynamic). Damage multipliers (conn room lost ×4, flood drag) apply on top of the per-vessel base.

---

## D018 — Volume-based flooding, buoyancy, and DC scaling

**Decision:** All flooding rates, buoyancy impact, and DC team effectiveness scale with section volume measured in compartments (1 compartment = 2×4 = 8 schematic grid units). A reference volume of 8 compartments normalises the scaling so the 688's average section preserves existing gameplay balance.

**Size system hierarchy:**
- Unit = 1 schematic grid cell
- Compartment = 2×4 = 8 units (base volume measure)
- Watchspace = 1+ compartments (a functional room)
- Watertight section = 1+ watchspaces between bulkheads

**Volume scaling formula:**
- `volScale = referenceVolume / sectionVolume` (where reference = 8)
- Flood ingress rate: `rate × volScale` — small sections fill faster
- Bilge pump drain: `0.012 × volScale` — proportional
- DC suppression: `FLOOD_FIGHT_RATE × volScale × eff` — more effective in small sections
- Buoyancy weight: `flooding × (volume / 8)` — large sections contribute more weight when flooded

**Effect on gameplay (688 example):**
- Reactor (3 comps): floods 2.67× faster, DC 2.67× more effective, buoyancy impact 0.375×
- Forward (12 comps): floods 0.67× slower, DC 0.67× less effective, buoyancy impact 1.5×
- Engineering (8 comps): unchanged (reference volume)

**How to apply:** `volume` property added to each `COMP_DEF` entry in every layout file. Read at runtime by `index.js` (flood tick), `effects.js` (buoyancy), and `dc-teams.js` (suppression).

---

## D019 — Per-room flooding (mirrors fire system)

**Decision:** Flooding is tracked per-room (watchspace) rather than per-section. Water spreads to adjacent rooms with very high probability horizontally and automatically downward (gravity). This mirrors the fire system architecture.

**Data structures:**
- `d.roomFlood[roomId]` — 0-1 per room (like `d.fire[roomId]`)
- `d.roomFloodRate[roomId]` — breach ingress rate per room
- `d.flooding[comp]` — computed aggregate (weighted average of room floods by colSpan) for backward compat

**Breach assignment:**
- First hit: impact room selected (already was), `roomFloodRate[impactRoom] = severity × 0.04` (~25s to fill one room)
- Second hit: new random room in section, `roomFloodRate = 0.15 + severity × 0.15` (catastrophic)

**Spread mechanics:**
- **Downward (gravity):** Automatic — water flows to rooms below at rate proportional to source room flood level. No chance roll.
- **Horizontal (same deck):** Very high spread chance — `(flood - 0.10) × 0.10 × dt` (~10× fire spread rate). Water finds every gap.
- **Upward:** Only when source room nearly full (>85%). Low chance — water must rise.
- **Cross-WTD:** Unchanged — via open/damaged WTDs at section level.

**Per-room system damage:** Systems in a room take one damage step when that room reaches 80% flooded. Replaces old deck-level damage thresholds (33%/67%).

**DC teams:** Target the room with the highest active breach rate in their section. Suppress `roomFloodRate` at that room. Move to next breached room when sealed.

**Section aggregation:** `flooding[comp]` = weighted average of all room floods in the section (weighted by `colSpan`). Drives evacuation (65%), sinking (100%), buoyancy, and trim.
