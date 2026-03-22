# Realism Overhaul — Test Plan

Regression checklist and per-phase test criteria. After each phase, run through the relevant section to catch breakage. This is especially important because we WILL repeatedly break the game during this overhaul.

---

## Regression Checklist (run after EVERY phase)

### Core Systems (must not break)
- [ ] Game starts without errors
- [ ] Vessel selection → loadout → dive flow works
- [ ] All 6 vessels load their correct layout
- [ ] Crew manifest loads correctly for all nations (USN/RN/DE)
- [ ] DC panel renders with correct room blocks
- [ ] Fire system: ignite → spread → detect → DC response → extinguish
- [ ] Flooding system: breach → per-room spread → DC seal → drain
- [ ] Torpedo tubes: load, fire, reload, swap, unload all work
- [ ] Weapon loadout screen: rack configuration applied correctly
- [ ] Speed/depth controls: respond correctly
- [ ] Helm: course changes, emergency turn, crash dive
- [ ] Watch rotation: fatigue → relief → handover
- [ ] Medical: casualty → dispatch → treat → return to duty
- [ ] Reactor: SCRAM → EPM → recovery sequence
- [ ] Emergency blow: trigger → vent → surface
- [ ] HP air: consumption, recharge, blow authority
- [ ] Periscope/masts: raise, lower, crush depth
- [ ] Comms: correct terminology per nation
- [ ] Dev panel: all buttons functional

### Rendering
- [ ] No canvas errors in console
- [ ] DC panel: room blocks, flood overlays, fire overlays, system labels
- [ ] Sonar display: contacts visible, bearing lines
- [ ] Command panel: tube status, speed controls, mast controls
- [ ] Message log: entries appearing, priority colours correct
- [ ] End screen: score, crew status, mission summary

---

## Per-Phase Test Criteria

### Phase 1 — World Scale
- [ ] World is 120nm × 120nm (verify world.w / world.h)
- [ ] Player can navigate across the world without errors
- [ ] Camera zoom: can zoom out to see tactical picture, zoom in for DC detail
- [ ] Minimap/tactical display shows full world
- [ ] Entities render correctly at range (not just nearby)
- [ ] Spawn positions place contacts at realistic ranges
- [ ] No performance degradation at larger scale
- [ ] Seabed depth correct for scenario location

### Phase 2 — Ocean Model
- [ ] SVP loads from scenario preset
- [ ] Mixed layer depth affects detection
- [ ] Going below the layer breaks direct-path detection
- [ ] CZ detections occur at correct ranges (~30nm intervals)
- [ ] Shadow zone: no detection between direct path and CZ1
- [ ] Bottom bounce: works in shallow water, not in deep
- [ ] Surface duct: enhanced detection within mixed layer
- [ ] Ambient noise: sea state affects detection threshold
- [ ] Biologics: seasonal/time-of-day variation
- [ ] Diurnal variation: mixed layer depth changes
- [ ] VLF comms: only receivable near surface

### Phase 3 — Torpedo Physics
- [ ] MK-48: correct speed (~55kt), correct range (~50km)
- [ ] Spearfish: correct speed (~70kt), correct range (~65km)
- [ ] Tigerfish: correct speed (~35kt), correct range (~21km)
- [ ] SST-4: correct speed (~35kt), correct range (~12km)
- [ ] Wire guidance: works to ~15nm, breaks correctly
- [ ] Torpedo fuel: runs out at max range
- [ ] Seeker activation: passive cruise, active terminal
- [ ] Search pattern: snake/spiral after wire cut
- [ ] Torpedo evasion: player can evade at range with time
- [ ] Missile ranges: Harpoon ~60nm, TASM ~250nm, Exocet ~27nm

### Phase 4 — AI Overhaul
- [ ] AI patrols assigned area (not stationary)
- [ ] AI detects player at realistic range using same sonar model
- [ ] AI goes through detect → classify → track → engage sequence
- [ ] AI develops firing solution over realistic time (10-20 min)
- [ ] AI fires at realistic range
- [ ] AI reacts to incoming torpedo (evasion + counter-fire)
- [ ] AI uses the layer tactically
- [ ] Surface ship AI: active sonar, helicopter coordination
- [ ] Engagement lasts 15-45 min, not 2-5 min

### Phase 5 — Scenarios
- [ ] All scenarios playable at realistic scale
- [ ] Time compression: works, auto-pauses on contact
- [ ] Mission pacing feels right
- [ ] Each scenario has correct ocean environment for location

### Phase 6 — Sonar UI
- [ ] Waterfall display shows bearing history
- [ ] CZ indicators visible on tactical display
- [ ] SVP display shows current ocean conditions
- [ ] Player can work contacts at realistic range
