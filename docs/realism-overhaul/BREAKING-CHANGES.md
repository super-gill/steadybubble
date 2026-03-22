# Realism Overhaul — Breaking Changes

Track what breaks when we change things, so nothing gets lost across sessions. Each entry records what changed, what broke, and whether it's been fixed.

Format: `BC-NNN` — phase — status (BROKEN/FIXED/ACCEPTED) — what broke and why

---

### Expected breakage by phase

**Phase 1 (World Scale):**
- [ ] Spawn positions — hardcoded coordinates won't place entities correctly
- [ ] Camera zoom — current zoom levels inadequate for large world
- [ ] Minimap — doesn't exist, essential at this scale
- [ ] Sonar detection — ranges calibrated for 12km world
- [ ] Torpedo engagement — ranges calibrated for 12km world
- [ ] AI proximity triggers — calibrated for 12km world
- [ ] Scenario wave spawning — spawn distances too close
- [ ] World boundary handling — edge-of-world behaviour
- [ ] Rendering culling — may draw off-screen entities
- [ ] Ground/seabed profile — calibrated for small world

**Phase 2 (Ocean Model):**
- [x] Layer mechanics — single fixed layer replaced with tile-based thermocline system
- [x] Sonar equations — entire detection model replaced with SNR-based (SL-TL-NL+AG)
- [x] Contact classification — ranges and timings adapted (TMA thresholds scaled)
- [x] TMA convergence — baseline thresholds scaled for new world units

**Phase 3 (Sonar / was "Torpedo Physics" in original plan — phases renumbered):**
- [x] All sonar detection uses propagation model
- [x] Layer penalty scales with thermocline strength
- [x] CZ detection from ocean model (dynamic, position-dependent)
- [x] Towed array uses VLF band at long range
- [x] Active sonar two-way TL, datum at ~40nm

**Phase 4 (Torpedo Physics — was Phase 3 in original plan):**
- [x] All weapon range/speed constants scaled to real values
- [x] Wire guidance range scaled (~15nm MK-48, ~10nm Tigerfish)
- [x] Torpedo launch velocity converted to wu/s
- [x] Missile speeds and ranges scaled
- [x] TDC lead angle uses correct wu/s conversion
- [x] Enable distance scaled (300→16 wu)

**Phase 5 (AI):**
- [ ] All AI behaviour triggers
- [ ] Contact prosecution patterns
- [ ] Weapon employment ranges
- [ ] Evasion behaviour

---

### Phase 1 — Discovered During Testing

| ID | Status | Description |
|----|--------|-------------|
| BC-001 | FIXED | Spawn at old 12km coordinates (maps.js hardcoded) — sub spawned in shallow water |
| BC-002 | FIXED | Depth snapped to 0 in shallow water — depthFloor went negative |
| BC-003 | FIXED | Grounding state never cleared — sub permanently stuck |
| BC-004 | FIXED | Depth strip rescaling caused perceived dive rate changes |
| BC-005 | FIXED | Seabed depth jumped at grid cell boundaries — no interpolation |
| BC-006 | FIXED | Test sub reactor SCRAM at depth — no casualty bypass flag |
| BC-007 | FIXED | Coolant leak threshold hardcoded to layer depth — not per-vessel |
| BC-008 | FIXED | Civilian spawn already uses dynamic world.w/h — no change needed |
| BC-009 | FIXED | Enemy depth + torpedo depth + depth charge detonation now use local seabed via seabedDepthAt() |
| BC-010 | FIXED | Land rendered from location grid mask — culled to visible screen area |
| BC-011 | FIXED | Sonar base range scaled to ~20nm (3700 wu), CZ band to ~28-34nm. Interim — Phase 3 replaces |
| BC-012 | FIXED | Speed conversion: ktsToWU was 1:1 (19.4× too fast). Now 185.2/3600. All movement corrected. |
| BC-013 | FIXED | Land rendering misaligned with entities — different screen centre used. Fixed to match w2s(). |
| BC-014 | FIXED | Procedural land masses inaccurately positioned — removed. Clean open ocean placeholder. |
