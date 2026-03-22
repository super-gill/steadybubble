# Realism Overhaul — Design Document

## 1. Purpose

Remove gameplay compression and scale the simulation to match real-world submarine warfare parameters. Detection ranges, engagement ranges, torpedo physics, world scale, and AI behaviour all move to realistic values derived from publicly available sources.

**Design principle:** Reality is the target. Where public data is ambiguous, err toward the more demanding interpretation. The game should reward the same decisions that real submarine officers make.

---

## 2. What Changes

| System | Current (compressed) | Target (realistic) | Scale factor |
|--------|---------------------|-------------------|-------------|
| World size | 12km × 12km | 120nm × 120nm (~220km²) | ~18× |
| Passive sonar detection | ~3-8km | 10-80nm (18-150km) depending on conditions | ~15-20× |
| Towed array detection | ~5-10km | 30-100+ nm (55-185km) CZ dependent | ~15× |
| Active sonar range | ~5km ping | 10-20nm (18-37km) | ~5× |
| Torpedo range (MK-48) | ~3km wire | 27nm (~50km) | ~16× |
| Torpedo range (Spearfish) | ~3km wire | 35nm (~65km) | ~21× |
| Torpedo speed (MK-48) | game units | 55+ kt | verify |
| Wire guidance range | 3km | 8-15nm (15-28km) practical | ~8× |
| Harpoon range | world-limited | 60nm (~110km) | verify |
| TASM range | world-limited | 250nm (~460km) | verify |
| ESM detection | 12km | 12-40nm (22-75km) | ~3-5× |
| Radar range | 7km | 15-25nm (28-46km) | ~5× |
| Engagement timeline | ~2-5 min per contact | 15-45 min per contact | ~8× |

---

## 3. What Does NOT Change

- Hull structure, compartmentation, damage control (vessel individuality work)
- Fire system (per-room, spread mechanics)
- Flooding system (per-room, gravity drain)
- Crew manifests, watch system, fatigue
- Weapon loadout system (rack, tubes, VLS)
- DC panel rendering, UI layout
- Vessel physics (acceleration, turn rate, depth handling)
- All casualty mechanics (reactor, hydrogen, chlorine, shaft seal, etc.)

---

## 4. Phase Structure

### Phase 1 — World Scale, Bathymetry & Terrain

**Objective:** Expand the world to realistic dimensions. Replace flat seabed with real bathymetry from geolocated data. Add coastline, continental shelves, and terrain collision.

#### 1A — World Scale
- World size: driven by location data (typically 120nm × 120nm / 222km × 222km)
- Camera zoom range: support zoomed-out tactical view and zoomed-in close view
- Minimap / tactical display: essential at this scale — player needs situational awareness
- Spawn positions: realistic patrol area separation (contacts at 20-40nm, not 2-4km)

#### 1B — Bathymetry
- Real seabed depth from GEBCO grid data (see `DATA-SOURCING.md`)
- 2D depth grid at ~0.5nm resolution per cell
- Continental shelf, shelf edge, deep ocean all represented by the data
- Seabed depth varies across the operational area — not a flat plane
- Bottom type grid (rock/sand/mud/mixed) for acoustic reflection

#### 1C — Coastline & Land
- Real coastline from Natural Earth / OpenStreetMap data
- Land cells are impassable — submarine cannot enter
- Rendered on the tactical display as filled landmass
- Islands, straits, channels all present from the data

#### 1D — Terrain Collision (Grounding)
Submarine can collide with the seabed or coastline. Impact severity depends on approach speed and angle.

**Collision types:**

| Type | Trigger | Damage |
|------|---------|--------|
| **Grounding (gentle)** | Depth ≥ seabed depth at ≤3kt, shallow angle | Minor — hull stress warning, speed zero, planes jammed. Reversible with ballast blow. |
| **Grounding (hard)** | Depth ≥ seabed depth at 3-10kt | Moderate — hull damage, potential flooding in lower rooms, sonar dome damage. Noise transient. |
| **Impact (severe)** | Depth ≥ seabed depth at >10kt or steep angle | Catastrophic — multiple room breaches, sonar destroyed, potential loss of boat. |
| **Coastal collision** | Submarine enters land cell at periscope depth or surfaced | Similar to grounding — speed-dependent damage. |

**Depth warnings (new comms):**
- "Conn, Helm — bottom rising, depth under keel 50 metres" (first warning)
- "Conn, Helm — shoal water, depth under keel 20 metres" (urgent)
- "Conn, Helm — collision alarm, depth under keel 10 metres" (critical)

**Minimum depth under keel:** Submarine draft + safety margin. ~12m for SSN, ~8m for Type 209.

#### 1E — Location Data System
- Each operational area is a data module in `src/config/locations/`
- Bathymetry grid, coastline polygons, bottom type grid, SVP profiles, weather ranges
- Adding a new location requires no code changes — only a new data file
- Documented repeatable process in `DATA-SOURCING.md`

**Initial locations (3):**

| Location | Character | Water depth | Bottom |
|----------|-----------|------------|--------|
| GIUK Gap (63°N 12°W) | Deep Atlantic, shelf transitions, Iceland/Greenland/UK coast | 200-2400m | Mixed/rock |
| Barents Sea (72°N 35°E) | Shallow shelf, no CZ, Norwegian/Russian coast | 200-400m | Sand |
| Eastern Mediterranean (34°N 28°E) | Deep warm water, strong thermocline, complex coastline | 100-2500m | Mud |

**Open questions:**
- Canvas rendering performance at this scale — are there too many draw calls?
- Waypoint/patrol route system — needed at this scale?
- Depth grid resolution: 0.5nm (926m) sufficient, or need finer for coastal areas?

**Sign-off:** World driven by real location data. Bathymetry visible on tactical display. Coastline rendered. Grounding damage works. Three locations loaded and verified.

---

### Phase 2 — Ocean Environment Model

**Objective:** Build a physically accurate ocean environment. Every scenario takes place in a real, geolocated ocean with real water column properties. Sound propagation — the foundation of all detection — derives from this environment.

#### 2A — Water Column Structure

The ocean is modelled as a vertical profile of sound velocity, which determines how sound propagates. Each scenario defines a location with real oceanographic data.

**Layers (top to bottom):**

| Layer | Depth | Properties | Tactical impact |
|-------|-------|-----------|----------------|
| **Surface mixed layer** | 0 to 50-200m (seasonal) | Uniform temperature from wind mixing. Sound velocity roughly constant. | Surface duct — enhanced short-range detection within this layer |
| **Main thermocline** | 50-200m to 600-1000m | Temperature drops rapidly. Sound velocity decreases. Sound refracts downward. | **The layer** — crossing it breaks direct-path detection. Primary tactical boundary. |
| **Secondary thermoclines** | Variable | Smaller temperature gradients within or below the main thermocline | Additional refraction — can create sub-surface ducts |
| **Halocline** | Variable (often 200-400m) | Salinity change. Affects sound velocity independently of temperature. | Complicates SVP — can reinforce or counteract thermocline |
| **Deep isothermal layer** | Below ~1000m | Temperature nearly constant (~2-4°C). Sound velocity increases with pressure. | Sound refracts upward — creates the SOFAR channel |
| **SOFAR channel** | ~600-1200m (varies by ocean) | Minimum sound velocity axis. Sound trapped here propagates thousands of miles. | Most submarines can't reach it (depth limit 250-480m). Affects CZ geometry. |

**Sound velocity formula (simplified Mackenzie):**
`c = 1448.96 + 4.591T - 0.05304T² + 0.0002374T³ + 1.340(S-35) + 0.01630D + 1.675×10⁻⁷D²`
Where T=temperature(°C), S=salinity(ppt), D=depth(m).

#### 2B — Propagation Paths

Sound from a source reaches a receiver via multiple paths. Each path has different range, loss, and tactical implications.

| Path | Range | Conditions | Player impact |
|------|-------|-----------|---------------|
| **Direct path** | 5-15nm | Source and receiver in same layer | Standard detection. Broken by going below the layer. |
| **Surface duct** | 10-20nm | Both in mixed layer, calm seas | Enhanced range in good conditions. Sea state degrades it. |
| **Convergence zone (CZ)** | ~30nm intervals | Deep water (>2000m), SVP curves sound back up | Intermittent detection at 30, 60, 90nm. Contact disappears between zones. |
| **Bottom bounce** | 10-25nm | Shallow/moderate water, reflective bottom | One or two bounces. Mud absorbs, rock reflects. |
| **Shadow zone** | 15-28nm (between direct path and CZ1) | Below the layer | **No detection.** Sound refracts away. Safe haven. |
| **SOFAR channel** | Hundreds of nm | Source near channel axis | Not tactically relevant (too deep for most subs) but affects CZ geometry |

**Convergence zone geometry:**
CZ range depends on SOFAR axis depth and water depth:
- Atlantic (~1000m axis): CZ1 at ~30nm, CZ2 at ~60nm
- Shallow water (<1500m): No CZ — bottom absorbs the refracted sound
- CZ detection is in narrow annuli (~3-5nm wide) — contact is detectable within the annulus, invisible outside it

#### 2C — Environmental Variables

**Geolocation (per scenario):**
Each scenario specifies a real-world location. Oceanographic properties are derived from that location's known characteristics.

```
scenario.location = {
  name: 'GIUK Gap — Winter',
  lat: 63.5, lon: -12.0,
  ocean: 'north_atlantic',
  season: 'winter',
  waterDepth: 2400,          // metres
  bottomType: 'mixed',       // rock/sand/mud/mixed
}
```

**Seasonal variation:**
- **Winter:** Deep mixed layer (150-200m), cold surface, good CZ conditions
- **Summer:** Shallow mixed layer (30-80m), warm surface, strong thermocline, poor CZ
- **Spring/Autumn:** Transitional — variable conditions

**Diurnal variation:**
- **Daytime:** Solar heating warms surface → shallower mixed layer, stronger gradient
- **Night:** Surface cooling → deeper mixed layer, weaker gradient
- **Dawn/dusk:** Transitional

**Sea state (Beaufort-derived):**
| Sea state | Wind (kt) | Surface noise | Mixed layer effect | Periscope/ESM |
|-----------|-----------|--------------|-------------------|---------------|
| 0-1 | 0-6 | Very low | Calm — shallow duct | Perfect visibility |
| 2-3 | 7-16 | Low-moderate | Some mixing | Good |
| 4-5 | 17-27 | Moderate-high | Active mixing, deepens duct | Degraded |
| 6+ | 28+ | High | Deep mixing, surface noise masks contacts | Poor — spray, waves |

**Ambient noise sources:**
- **Wind/waves:** Scales with sea state. Broadband noise that raises detection threshold.
- **Shipping:** Distant merchant traffic. Stronger near sea lanes (English Channel, Strait of Gibraltar).
- **Biologics:** Marine life noise. Shrimp layer (~200m) in warm water. Whale calls (seasonal). Can mask narrowband tonals.
- **Rain:** Broadband surface noise during precipitation.

**Bottom type effects:**
| Type | Reflection | Scattering | Tactical impact |
|------|-----------|-----------|----------------|
| Rock | High | Low | Good bottom bounce. Active returns strong. |
| Sand | Moderate | Moderate | Moderate bottom bounce. |
| Mud | Low | High | Poor bottom bounce. Sound absorbed. |
| Mixed | Variable | Variable | Unpredictable — realistic for many areas. |

#### 2D — Acoustic Frequency Effects

Different sonar frequencies propagate differently:

| Band | Frequency | Absorption | What it detects | Range |
|------|-----------|-----------|----------------|-------|
| VLF | <1 kHz | Almost none | Machinery tonals, distant CZ contacts | Very long |
| LF | 1-10 kHz | Low | Broadband flow noise, close contacts | Long |
| MF | 10-50 kHz | Moderate | Active sonar returns, torpedo seekers | Medium |
| HF | >50 kHz | High | Mine detection, close-range active | Short |

At 50nm, only VLF/LF reaches the receiver — you're hearing low-frequency machinery, not broadband hull flow. This means:
- Narrowband detection (specific tonals) works at long range
- Broadband detection (flow noise) only works at short range
- Active sonar attenuates rapidly beyond ~20nm

#### 2E — VLF Communications

VLF radio penetrates seawater to ~20m depth. Submarines must be near the surface to receive broadcast.
- Below ~20m: no VLF reception
- At periscope depth (~18m): full reception
- Towed VLF buoy: could allow reception at moderate depth (future feature)

#### 2F — Location Presets

Planned scenario locations with distinct oceanographic character:

| Location | Depth | Bottom | Character |
|----------|-------|--------|-----------|
| GIUK Gap | 2400m | Mixed | Deep Atlantic, good CZ, strong winter thermocline |
| Barents Sea | 350m | Sand | Shallow, no CZ, strong seasonal ice effects |
| Norwegian Sea | 3000m | Mud | Deep, good CZ, heavy shipping noise |
| Mediterranean | 2500m | Mud | Warm, strong thermocline, saline outflow layer |
| North Sea | 100m | Sand | Very shallow, no CZ, no layer, noisy |
| Persian Gulf | 60m | Sand | Extremely shallow, hot, acoustically terrible |
| North Pacific | 5000m | Mud | Very deep, distant SOFAR, long-range CZ |

**Sign-off:** Ocean environment loads per scenario. SVP drives propagation. CZ detections occur at correct ranges. Layer provides real protection. Seasonal/diurnal variation visible. Sea state affects detection.

---

### Phase 3 — Sonar Propagation Engine

**Objective:** Implement the detection equations that use the ocean model.

Moved sonar implementation detail to a separate phase from the ocean model, since the environment data (Phase 2) can be built and verified before the propagation math is wired in.

---

### Phase 4 — Torpedo Physics

**Objective:** Scale torpedo performance to match published specifications.

**Torpedo parameters (from public sources):**

| Weapon | Speed | Range | Seeker | Wire |
|--------|-------|-------|--------|------|
| MK-48 ADCAP | 55+ kt | 50km (27nm) | Active/passive | Yes, ~15nm practical |
| Spearfish | 70+ kt | 65km (35nm) | Active/passive | Yes |
| Tigerfish Mk 24 | 35 kt | 21km (11nm) | Wire-guided, passive | Yes |
| SST-4 | 35 kt | 12km (6.5nm) | Wire-guided, passive | Yes |
| MK-46 (ASROC) | 45 kt | 11km (6nm) | Active | No |

**Torpedo behaviour:**
- **Run-to-enable:** Arm after 300-1000m (current: 300m — reasonable)
- **Wire guidance:** Operator steers torpedo via wire to target bearing. Wire breaks at excessive speed or manoeuvre. Current wire model exists — scale range.
- **Search pattern:** After wire cut or at end of wire, torpedo enters autonomous search. Snake search or spiral. Current model needs verification.
- **Seeker activation:** Active ping from torpedo seeker at close range (~2-4nm). Alerts the target.
- **Counter-countermeasures:** Modern torpedoes can discriminate between real targets and decoys. Older torpedoes (Tigerfish, SST-4) more susceptible.
- **Torpedo evasion:** Knuckle turns, speed changes, depth changes, countermeasures. At realistic ranges, the player has much more time to evade.
- **Re-attack:** If torpedo misses, it can re-acquire and come around for another pass (fuel permitting).

**Missile parameters:**

| Weapon | Speed | Range | Seeker | Launch |
|--------|-------|-------|--------|--------|
| UGM-84 Harpoon | Mach 0.85 | 60nm (110km) | Active radar | Tube-launched, surfaced capsule |
| BGM-109B TASM | Mach 0.7 | 250nm (460km) | Active radar | Tube or VLS |
| SM39 Exocet | Mach 0.93 | 27nm (50km) | Active radar | Tube-launched, 55m max depth |

**Open questions:**
- Torpedo fuel modelling — should torpedoes run out of fuel at max range?
- Counter-countermeasure sophistication by weapon type?
- Acoustic homing model detail (active cone, passive listening, Doppler)?

**Sign-off:** Torpedoes run at correct speeds and ranges. Wire guidance works at realistic range. Engagement timeline feels authentic.

---

### Phase 5 — AI Overhaul

**Objective:** AI opponents that make intelligent tactical decisions at realistic ranges and timescales.

**Current AI:** Proximity-triggered behaviour. Detect at close range, prosecute, fire counter-shots. Adequate for 12km world, completely insufficient for 120nm world.

**Target AI:**
- **Patrol behaviour:** AI submarines patrol assigned areas, change course periodically, vary speed. Not just stationary targets.
- **Detection:** AI uses the same sonar model as the player. Detects the player at realistic ranges based on player noise signature.
- **Classification:** AI goes through detect → classify → track → target sequence. Doesn't instantly know the player's location.
- **Prosecution:** AI manoeuvres to develop a firing solution. Course changes to get bearing rate. Takes time — 10-20 minutes of tracking before firing.
- **Weapon employment:** AI fires at realistic range with realistic weapons. Wire-guides torpedoes.
- **Evasion:** AI reacts to incoming torpedoes — speed changes, depth changes, countermeasures, knuckle turns. Current evasion exists — verify it works at scale.
- **Counter-detection:** AI detects player's torpedo launch transient and reacts (counter-fire, evasion, or both).
- **Surface ship AI:** ASW escorts use active sonar, helicopters deploy sonobuoys and dipping sonar. Coordinated prosecution.
- **Submarine AI:** Enemy submarines use passive sonar, go quiet, use the layer. The hardest opponents.

**Open questions:**
- How sophisticated should AI TMA be? Should it make mistakes?
- Should AI have different skill levels (conscript vs elite)?
- Should AI coordinate between units (ASW taskforce tactics)?

**Sign-off:** AI detects, tracks, and engages at realistic ranges. AI makes reasonable tactical decisions. Engagements last 15-45 minutes, not 2-5.

---

### Phase 6 — Scenario Redesign

**Objective:** Rebuild all scenarios for realistic scale.

- **Single contact:** Enemy submarine at 20-40nm. Player must close, develop solution, engage.
- **Barrier patrol:** Multiple contacts spread across a 60nm front. Player must penetrate without detection.
- **SSBN hunt:** Boomer on bastion patrol with escort SSN. 100nm patrol area.
- **ASW taskforce:** Surface group with active sonar, helicopters, ASROC. Player must evade or fight through.
- **Boss fight:** Elite enemy submarine. Extended cat-and-mouse at realistic range.

**Pacing considerations:**
- Time compression: player should be able to accelerate time during quiet periods (×2, ×4, ×8). Auto-pause on sonar contact.
- Watch rotation becomes more meaningful — patrols last hours, crew fatigue matters.
- Atmospheric systems (O2, CO2) become relevant on extended patrols at depth.

**Open questions:**
- Mission duration: 30 min real-time? 60 min? Adjustable?
- Time compression UI: how to present it?
- Random contact generation vs scripted encounters?

**Sign-off:** Each scenario plays at realistic pace. Engagements feel authentic. Player has tactical decisions to make, not just reaction speed.

---

### Phase 7 — Sonar Operator Interface

**Objective:** Give the player the tools to work sonar at realistic ranges.

At realistic scale, the player needs more sonar information:
- **Waterfall display:** Bearing-time history. Visual narrowband/broadband.
- **Bearing deviation indicator (BDI):** Track contact bearing over time.
- **Range estimation:** Passive ranging via bearing rate + speed estimate.
- **CZ indicators:** Show predicted convergence zone annuli on tactical display.
- **Sound velocity profile display:** Show current SVP, layer depth, CZ predictions.
- **Sonar intercept:** Detect active sonar transmissions from other platforms.

**Open questions:**
- How much sonar operator detail is fun vs tedious?
- Should TMA be manual (player plots bearings) or automated (current system)?
- Narrowband vs broadband distinction — worth modelling?

**Sign-off:** Player can work contacts at realistic range using realistic tools.

---

## 5. Implementation Notes

### Performance
- Larger world with same entity count = less rendering load per frame (most entities off-screen)
- Sonar propagation model should be pre-computed per-frame, not per-entity-pair
- AI decision-making can run at lower frequency (every 5-10s, not every frame)

### Backward Compatibility
- All damage, DC, crew, flooding, fire systems are scale-independent — no changes needed
- Vessel physics (speed, depth, acceleration) are already in real units
- Weapon definitions in constants.js just need range/speed values updated

### Testing
- Each phase is independently testable
- Phase 1 (world scale) will immediately reveal which systems break at larger scale
- AI overhaul (Phase 4) is the largest and riskiest piece — plan extra testing time

---

## 6. Dependencies

| Phase | Depends on | Blocks |
|-------|-----------|--------|
| 1 — World Scale & Camera | Nothing | Everything else |
| 2 — Ocean Environment Model | Phase 1 | Phase 3 (sonar uses ocean) |
| 3 — Sonar Propagation Engine | Phases 1, 2 | Phase 5 (AI uses sonar) |
| 4 — Torpedo Physics | Phase 1 | Phase 5 (AI fires torpedoes) |
| 5 — AI Overhaul | Phases 1, 3, 4 | Phase 6 (scenarios use AI) |
| 6 — Scenario Redesign | Phase 5 | Phase 7 (scenarios test sonar UI) |
| 7 — Sonar Operator Interface | Phase 3 | Nothing |

Phase 7 (Sonar UI) can be developed in parallel with Phases 4-6.

---

## 8. Open Questions

| # | Question | Answer | Status |
|---|----------|--------|--------|
| 1 | World size: 120nm × 120nm, or different? | 120nm × 120nm confirmed | ✅ |
| 2 | Canvas performance at scale: need investigation? | Test during Phase 1 implementation | ✅ |
| 3 | Time compression: what multipliers? Auto-pause on what events? | 2×, 6×, 9×. Auto-pause events TBD | ✅ |
| 4 | AI sophistication: how smart should they be? Skill levels? | Build elite first, then walk back into profiles (low/medium/high/elite). Applied per-scenario or random. | ✅ |
| 5 | Mission duration target: 30 min? 60 min? Variable? | Variable per scenario. Must track player engagement — avoid long dead periods. Consideration for later. | ✅ |
| 6 | Sonar operator detail: waterfall display, BDI, manual TMA? | Captain's perspective — no direct sonar/TMA interaction. Keep current interface for now, UI rethink later. | ✅ |
| 7 | First scenario location: GIUK Gap, Barents, Norwegian Sea? | GIUK Gap, Barents Sea, Eastern Med (confirmed earlier) | ✅ |
| 8 | SVP computation: every frame or cached per-scenario? | Cache per-scenario. Performance-conscious — browser limits. | ✅ |
| 9 | Should weather change during a mission, or fixed per scenario? | Fixed initially. Dynamic weather as a future option. | ✅ |
| 10 | Narrowband vs broadband: separate sonar modes for the player? | Yes, essential. Needs its own UI elements — discuss UI before implementing. | ✅ |
| 11 | CZ detection: automatic or requires operator action? | Crew-operated — sonar team detects and reports. CO commands, crew executes. Nothing fully automated. | ✅ |
| 12 | Towed VLF buoy: model for receiving comms at depth? | Yes — put mechanics in place now, actual use comes later. | ✅ |
