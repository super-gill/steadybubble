# Realism Overhaul — Decisions Log

Architectural and design decisions made during the realism overhaul. Recorded so they are not re-argued in future sessions.

---

### D-RO-001 — Separate ocean-environment.js from ocean.js

**Decision:** Water column physics (SVP computation, propagation model, ambient noise, weather) lives in a new `ocean-environment.js` file, separate from `ocean.js` (which handles bathymetry and terrain collision).

**Rationale:** These are distinct concerns with different update frequencies. Terrain is static per scenario; SVP/propagation change with diurnal variation. Separating them keeps both files focused and testable. `ocean-environment.js` imports from `ocean.js` (for `seabedDepthAt`, `bottomTypeAt`) but not vice versa.

---

### D-RO-002 — Propagation recompute throttle (>2m layer change)

**Decision:** Only recompute propagation parameters when the mixed layer depth changes by more than 2 metres from the last computation.

**Rationale:** Diurnal variation changes mixed layer depth continuously (every frame). Recomputing propagation (CZ ranges, direct path range, etc.) every frame is unnecessary — these values change slowly over sim-hours. The 2m threshold means roughly 1 recompute per few sim-minutes, which is imperceptible to the player but eliminates wasted computation.

---

### D-RO-003 — Weather fixed per scenario

**Decision:** Weather (wind, sea state, precipitation, cloud cover) is rolled once on scenario init from location seasonal ranges. It does not change during a mission.

**Rationale:** Per DESIGN.md open question #9 — dynamic weather is a future option. Fixed weather simplifies Phase 2 and avoids the complexity of weather transitions mid-mission. The diurnal cycle provides sufficient environmental variation for now.

---

### D-RO-004 — CZ geometry from SOFAR axis depth

**Decision:** Convergence zone range is computed as `sofarAxisDepth × 0.03 + 5` (nm), clamped to 20-40nm. CZ requires water depth >1500m AND SOFAR axis well below the mixed layer (>100m deeper).

**Rationale:** CZ range in reality depends on the geometry of the SVP curve — how deep sound must travel before pressure-induced velocity increase refracts it back upward. The SOFAR axis depth is a good proxy for this geometry. The >1500m water depth requirement prevents CZ in shallow seas (Barents, North Sea) where the bottom absorbs the energy before refocusing can occur. The SOFAR-below-mixed-layer requirement correctly prevents CZ in winter at high latitudes where the SOFAR axis is at or near the surface.

---

### D-RO-005 — SNR-based detection replaces linear falloff

**Decision:** All sonar detection now uses `SNR = Source Level - Transmission Loss - Noise Level` instead of the old linear `signal = noise × (1 - d/baseRange)`.

**Rationale:** Linear falloff with a hard range cutoff is physically wrong — it ignores propagation paths, frequency effects, and environmental conditions. The SNR model produces detection ranges that naturally vary with conditions: CZ detection at 30nm in deep water, shadow zones where contacts vanish, surface duct enhancement in calm conditions. The player's tactical decisions (depth, speed, course) now have realistic acoustic consequences.

---

### D-RO-006 — Layer penalty scales with thermocline gradient

**Decision:** Cross-layer signal attenuation scales with `|thermoclineGradient| × 5`, clamped to 0.35-0.85 (was fixed 0.60).

**Rationale:** A strong summer thermocline (-0.12°C/m) should provide much better protection than a weak winter gradient (-0.02°C/m). In reality, NATO Cold War doctrine explicitly exploited seasonal thermocline variations — submarines would operate differently in summer vs winter because the layer's effectiveness changed. Summer: penalty 0.40 (60% signal loss). Winter: penalty 0.85 (15% signal loss).

---

### D-RO-007 — Towed array uses VLF band at long range

**Decision:** Towed array detection beyond 15nm uses VLF absorption rates (0.001 dB/nm) instead of LF (0.01 dB/nm).

**Rationale:** Towed arrays are designed specifically to detect low-frequency machinery tonals. VLF propagates with almost zero absorption — the towed array's advantage is hearing the deep bass rumble of reactor coolant pumps and turbine generators at very long range. This gives it a meaningful range advantage over the hull array (which is better at MF/broadband) and matches real towed array operational performance.

---

### D-RO-008 — Active sonar two-way transmission loss

**Decision:** Active sonar computes 2× one-way transmission loss (MF band). Source level 220dB, threshold 80dB.

**Rationale:** Active sonar must transmit a ping to the target AND receive the echo back — the sound travels the distance twice. This naturally limits active range to ~10-20nm even with a powerful source, while the one-way ping datum is heard by enemies at ~40nm. This asymmetry (short echo range, long datum range) is exactly why real submariners avoid going active — the tactical cost far exceeds the benefit.

---

### D-RO-009 — North Atlantic SVP data over high-latitude data

**Decision:** Winter MLD reduced from 400m (World Ocean Atlas at 63.5°N) to 260m (North Atlantic typical). All seasons adjusted to match LAYER-GENERATION-GUIDANCE.md ranges.

**Rationale:** The 400m value is accurate for the extreme high-latitude winter at 63.5°N but made the thermocline unusable over the Iceland-Faroe Ridge (avg 622m depth — only 222m of water below the layer). The North Atlantic typical values (200-320m winter range) are a small concession that allows the thermocline to work realistically across all bathymetric zones — deep basins get a full thermocline, the ridge gets a compressed or absent one, shallow shelf gets nothing. The player experience of "hunting for the layer" becomes meaningful rather than the layer being universally absent in winter.

---

### D-RO-010 — Tile-based thermocline with spatial patchiness

**Decision:** Thermocline is generated as a grid of ~27nm (50km) tiles with independent parameters per tile, bilinearly interpolated for smooth transitions. Patchiness is horizontal — some tiles have a layer, some don't.

**Rationale:** A thermocline that's either uniformly present or uniformly absent across the entire operational area is tactically uninteresting. Real ocean thermoclines are patchy — they vary over tens of kilometres depending on local bathymetry, currents, and mixing. The tile system creates authentic operational decisions: the player may find the layer present at 80m, then thinning to nothing over the ridge, then reappearing deeper in the Norwegian Basin. This is exactly the kind of uncertainty that Cold War submarine COs dealt with — the XBT drop wasn't just a formality, it was essential intelligence.

---

### D-RO-011 — Torpedo transit speed separate from search speed

**Decision:** Torpedoes transit at 25-40kt (depending on type) rather than the old 12-18kt "approach speed." Sprint speed (55-70kt) activates only when the seeker has a lock.

**Rationale:** The old approach speed was calibrated for a 12km world where torpedoes reached targets in seconds. At realistic scale, an 18kt torpedo takes 53 minutes to cover 16nm — longer than its 30-minute endurance. Real MK-48 runs at moderate speed (~40kt) during wire-guided transit, reserving sprint for terminal homing. The transit speed must cover realistic engagement ranges (15-25nm) within the weapon's endurance.

---

### D-RO-012 — Sonar equation calibration (source level, noise floor, array gain)

**Decision:** Source levels: quiet sub 120dB, noisy sub 150dB, surface ship 155-185dB. Receiver noise: own-ship 55-95dB, ambient 55-70dB. Array gain: hull +25dB, towed +30dB, enemy 18-20dB. Detection threshold -6dB.

**Rationale:** Initial calibration had source levels too low (110dB) and noise floors too high (90dB), making detection impossible beyond ~3nm. The recalibrated values produce 18nm hull detection of a quiet sub — consistent with published passive sonar performance for BQQ-5/2076 class arrays. Array gain was entirely missing; real sonar arrays provide 20-30dB processing gain from beamforming and integration that is essential to the sonar equation.

---

### D-RO-013 — Contact classification replaces suspicion thresholds

**Decision:** AI state machine driven by contactState progression (NONE → DETECTION → CLASSIFIED → IDENTIFIED → TRACKING) instead of suspicion float thresholds (0.22/0.78).

**Rationale:** A real submarine crew doesn't have a "suspicion meter." They have contacts that they classify and prosecute. A Soviet crew detecting an unidentified submerged contact in GIUK goes to action stations — they don't wait for suspicion to accumulate. The classification system mirrors real doctrine: detect → classify → identify → prosecute. Each stage requires accumulated observations and TMA quality, naturally producing realistic prosecution timelines.

---

### D-RO-014 — No cheats policy

**Decision:** All direct reads of player.wx/wy for AI decision-making removed. AI uses only sensor-derived data.

**Rationale:** The AI must play by the same rules as the player. Reading the player's true position for patrol heading bias, intercept projection, or counter-fire targeting is cheating — it makes the AI appear competent by giving it information it hasn't earned. An elite AI should be competent because it uses its sensors and TMA well, not because it knows where the player is.

---

### D-RO-015 — SNR-based bearing noise

**Decision:** Bearing accuracy driven by signal quality (signal01 from SNR), not distance-based formula. Hull: 1°-8°. Towed: 0.5°-5.5°.

**Rationale:** The old formula `(80 + d×0.10) / d` produced ~6-10° noise at all ranges regardless of signal strength. Real sonar bearing accuracy depends on SNR — a loud close contact gives tight bearings, a faint distant one gives loose bearings. The SNR-based approach naturally scales and produces bearings consistent with the detection quality.

---

### D-RO-016 — Bearing-rate range removed

**Decision:** Passive range estimation via bearing-rate formula removed entirely. Range now solely from cross-bearing triangulation and active ping.

**Rationale:** The formula `R = ownSpeed × sin(θ) / bearingRate` divides by a tiny, noisy number (bearing rate at 10nm+). This produced wildly unstable range estimates (jumping between 0.3nm and 20nm). Cross-bearing triangulation is geometrically sound but requires significant baseline (500m+ of player movement) and crossing angle. Range estimation needs a dedicated rework as a separate project.
