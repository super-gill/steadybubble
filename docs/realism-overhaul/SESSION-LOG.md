# Realism Overhaul — Session Log

Detailed record of each work session. Read this to understand what was done, what problems were encountered, and how they were solved.

---

## Session 1 — 2026-03-21: Project Scoping

### What was done
- Created DESIGN.md with 6-phase structure
- Identified all systems that need scaling and those that don't
- Documented current vs target values from public sources
- Mapped phase dependencies

### Key decisions
- Reality is the target — no gameplay compression
- Damage control, flooding, fire, crew systems are scale-independent and don't change
- AI overhaul is the largest and riskiest piece
- Time compression needed for pacing at realistic scale
- Ocean must be geolocated — real place, real properties, seasonal, with weather
- Full water column structure: mixed layer, thermocline, halocline, deep isothermal, SOFAR
- Terrain collision (grounding) must cause speed-dependent damage
- Data sourcing process must be documented and repeatable
- Three initial locations: GIUK Gap, Barents Sea, Eastern Mediterranean
- System must be scalable — adding a new ocean is just adding a data file

### Documents created
| File | Purpose |
|------|---------|
| `DESIGN.md` | Master design — 7 phases, ocean model, all specs |
| `SESSION-LOG.md` | This file |
| `DECISIONS.md` | Technical decisions log |
| `BUGS.md` | Project-specific bug tracker |
| `BACKLOG.md` | Unforeseen requirements discovered during implementation |
| `BREAKING-CHANGES.md` | Track what breaks, expected breakage per phase |
| `DATA-MODEL.md` | All new variables, structures, constants |
| `TEST-PLAN.md` | Regression checklist + per-phase test criteria |
| `DATA-SOURCING.md` | Repeatable process for obtaining geographic/oceanographic data |

---

## Session 2 — 2026-03-21: Phase 1 Implementation (World Scale & Bathymetry)

### What was done
- Created location data system (`src/config/locations/`)
- Created GIUK Gap location with procedurally generated bathymetry:
  - 120×120 grid (1nm resolution)
  - Iceland (NW corner), Faroe Islands (mid), Scottish coast (S), Norwegian coast (E)
  - Depth range: -200m (land) to 3000m (deep Atlantic)
  - Bottom type: rock (shelf), sand (mid), mixed (slope), mud (deep)
  - Seasonal SVP profiles (winter/spring/summer/autumn)
  - Weather ranges per season
- Created ocean system (`src/systems/ocean.js`):
  - `seabedDepthAt(wx, wy)` — depth lookup from bathymetry grid
  - `isLand(wx, wy)` — land check
  - `bottomTypeAt(wx, wy)` — bottom type lookup
  - `tickOcean(dt)` — depth-under-keel tracking, grounding detection
  - Grounding severity: gentle (<3kt), hard (3-10kt), severe (>10kt)
- Wired ocean system into sim loop:
  - Location loaded on `resetScenario()` from scenario config
  - `world.w/h` set from location data (120nm = 22,224 wu)
  - `world.ground` set from deepest point in bathymetry
  - `tickOcean()` runs every frame after player physics
  - Grounding damage wired to damage system (forward compartment hit + sonar destruction on severe + acoustic transient)
- Updated camera: zoom min lowered from 0.04 to 0.008 for tactical overview
- Updated spawn ranges: 20-40nm for contacts, 30-60nm for waves
- Updated depth strip HUD: shows local seabed depth from bathymetry, not flat world.ground
- Updated nav.js depth clamp: uses local seabed depth
- Player spawns at world centre (dynamic, not hardcoded 6000,6000)

### Files created
| File | Purpose |
|------|---------|
| `src/config/locations/index.js` | Location dispatcher |
| `src/config/locations/giuk-gap.js` | GIUK Gap location data (bathymetry, land, SVP, weather) |
| `src/systems/ocean.js` | Ocean environment system (bathymetry lookup, terrain collision) |

### Files modified
| File | Changes |
|------|---------|
| `src/sim/index.js` | Ocean imports, location loading in resetScenario, tickOcean in update loop, grounding damage, dynamic player spawn |
| `src/systems/nav.js` | Depth clamp uses local seabed, zoom range widened |
| `src/render/render-hud.js` | Depth strip shows local seabed from bathymetry |
| `src/config/constants.js` | Spawn ranges scaled to 20-40nm |

### Known issues / not yet done
- Land not rendered on tactical display (data exists, rendering not wired)
- Civilian spawn at world edges needs updating for larger world
- Enemy depth clamp still uses world.ground in some places (sim/index.js, torpedo.js, weapons.js)
- No time compression yet
- Sonar detection ranges not yet scaled (Phase 3)

### Build status
Clean build (Vite production, 74 modules). No errors.

---

## Session 2 (continued) — Phase 1 Implementation & Testing

### Phase 1 deliverables
- Location data system (`src/config/locations/`) with GIUK Gap
- Ocean system (`src/systems/ocean.js`) with bathymetry lookup, terrain collision, DUK tracking
- World scales to 120nm from location data
- Spawn ranges scaled to 20-40nm
- Camera zoom range widened (0.008 to 8.0)
- Depth strip: centre-follow with fixed 800m window
- Depth HUD shows local seabed from bathymetry
- Nav.js depth clamp uses local seabed
- Grounding damage wired to damage system (speed-dependent severity)
- Test submarine (DEV TEST PLATFORM) for exploring bathymetry

### Bugs found and fixed during testing

**Depth snapping to 0 on grounding:** `_depthFloor = seabed - 40` went negative in shallow water → `Math.max(0, -10) = 0` → sub teleported to surface. Fixed: floor can't go below sub's draft.

**Grounding state permanent:** Once grounded, state never cleared. Fixed: auto-clears when sub moves to water with >20m DUK.

**Depth strip rescaling affecting perceived dive rate:** Strip rescaled as seabed depth changed → visual dive speed varied → looked like physics were broken. Fixed: fixed 800m window with centre-follow. Sub stays centred, bar scrolls.

**Spawn at old coordinates:** `maps.js` had hardcoded `playerSpawn: {wx:4000, wy:5000}` from 12km world → spawned in shallow water. Fixed: set to null, falls through to `world.w * 0.5`.

**Bilinear interpolation for seabed:** Grid cells are 1nm wide → abrupt depth jumps at cell boundaries. Fixed: `seabedDepthAt()` uses bilinear interpolation between 4 corner cells.

**Reactor SCRAM on test sub:** Test sub dived deep → coolant leak triggered → SCRAM. Fixed: `noPropulsionCasualties` flag skips reactor/coolant ticks. Also fixed coolant leak threshold to use vessel's `safeDivingDepth` instead of fixed layer depth.

### UI restructure — tabbed command panel

Bottom panel restructured from single horizontal strip to tabbed layout:
- **WEAPONS tab:** Tubes, Masts, Wire, VLS, TDC
- **BALLAST & TRIM tab:** Trim panel, Status
- **DEPTH & SPEED tab:** Engine order, Depth order, Posture, Emergency
- **Collapse/expand button (▼/▲):** Panel collapses to tab bar only
- Panel height increased to 220 units
- Sections at fixed preferred widths (no stretching)
- Tab buffer below buttons prevents overlap with content

### Files created
| File | Purpose |
|------|---------|
| `src/config/locations/index.js` | Location dispatcher |
| `src/config/locations/giuk-gap.js` | GIUK Gap location data |
| `src/systems/ocean.js` | Ocean environment system |
| `src/config/vessel-layouts/layout-dev.js` | Dev test submarine layout |

### Files modified
| File | Changes |
|------|---------|
| `src/sim/index.js` | Ocean integration, location loading, grounding damage, dynamic spawn |
| `src/systems/nav.js` | Local seabed depth clamp, zoom range, ocean import |
| `src/render/render-hud.js` | Centre-follow depth strip, local seabed display |
| `src/render/panels/render-command.js` | Tabbed panel with collapse, fixed-width sections |
| `src/render/render-utils.js` | Dynamic PANEL_H based on collapse state |
| `src/state/ui-state.js` | panelTab, panelCollapsed state |
| `src/config/constants.js` | Panel height 220, spawn ranges scaled |
| `src/config/vessels.js` | Test submarine, noPropulsionCasualties flag |
| `src/config/vessel-layouts/index.js` | Dev layout registered |
| `src/sim/player-physics.js` | noPropulsionCasualties guard, per-vessel coolant stress depth |
| `src/utils/maps.js` | Cleared hardcoded spawn position |

### Phase 1 open items closed

**BC-008 (civilian spawn):** Already uses dynamic `world.w/h` — no fix needed.

**BC-009 (enemy/torpedo depth clamp):** Enemy depth, torpedo depth, and depth charge detonation now use `seabedDepthAt()` for local seabed instead of flat `world.ground`. Added ocean import to `sim/index.js` (via `_OCEAN` module ref) and `torpedo.js`.

**BC-010 (land rendering):** Grid-based land rendering from location mask. Culled to visible screen area (only draws cells in the camera viewport). Brown land cells replace the old polygon system. Iceland, Faroes, Scotland, Norway all visible when zoomed out.

**BC-011 (sonar detection):** Interim scaling — base passive range from 2800→3700 wu (~20nm), CZ band from 4800-5500→5200-6200 wu (~28-34nm). This is temporary — Phase 3 (sonar propagation engine) replaces the entire detection model.

### Additional files modified
| File | Changes |
|------|---------|
| `src/render/render-world.js` | Grid-based land rendering from location mask with culling |
| `src/systems/sensors.js` | Interim sonar range scaling for larger world |
| `src/systems/torpedo.js` | Torpedo depth clamp uses local seabed |

### Build status
Clean build (Vite production, 75 modules). No errors.

### Additional fixes from continued testing

**BC-012 — Speed 19.4× too fast:** `ktsToWU()` was `k * 1` (the old compression). Changed to `k * (185.2/3600)`. Fixed in nav.js (player), spawn.js (enemies/civilians), sim/index.js (AI speed targets), torpedo.js (weapon speeds). At 20kt, 1nm now takes ~3 minutes (correct).

**BC-013 — Land rendering misaligned:** Land used `canvas.width/2` as centre but entities use `(canvas.width - stripW)/2`. Fixed to use same centre with strip/panel offsets.

**BC-014 — Procedural land removed:** Fake Iceland/Faroes/Scotland were inaccurately positioned. Replaced with clean open ocean (800-2600m depth with gentle gradients). Land rendering system retained for real GEBCO data later.

**Grid fixed at 1nm:** Replaced adaptive grid with fixed 185.2wu (1nm) spacing. Grid only drawn within world bounds.

**World edge visible:** Grey background outside world bounds. Sea colour only fills the operational area. Clear boundary visible when zoomed out.

**UI tab panel:** Bottom panel restructured into tabs (WEAPONS / BALLAST & TRIM / DEPTH & SPEED) with collapse toggle. Fixed-width sections, tab buffer for spacing, improved inactive tab contrast.

### Additional files modified
| File | Changes |
|------|---------|
| `src/systems/nav.js` | ktsToWU conversion (185.2/3600) |
| `src/ai/spawn.js` | All spawn velocities wrapped with spdWU() |
| `src/sim/index.js` | AI speed targets converted via ktsToWU |
| `src/systems/torpedo.js` | Torpedo speeds converted via KTS_TO_WU |
| `src/render/index.js` | Fixed 1nm grid, grey outside world bounds |
| `src/render/render-world.js` | Land rendering aligned to w2s centre |
| `src/config/locations/giuk-gap.js` | Procedural land removed, clean open ocean |

### Real GEBCO bathymetry

Fetched 14,400 real depth points from GEBCO 2020 via Open Topo Data API.
- Tool: `tools/fetch-bathymetry.cjs` (documented in DATA-SOURCING.md)
- Bounds: 62.5°N–64.5°N, 14.74°W–10.26°W (120nm × 120nm at 63.5°N)
- Output: `src/config/locations/giuk-gap-bathymetry.json` (60KB, static)
- Depth range: 0–1897m, avg 622m. Iceland-Faroe Ridge area confirmed.
- Procedural bathymetry replaced with real data. Procedural land removed.

SVP profiles updated for high-latitude regime based on published oceanographic data:
- Winter at 63°N: deep mixed layer (400m), near-isothermal, SOFAR axis at surface
- Summer: shallow mixed layer (30m), strong seasonal thermocline

### Dev features added

**Dev teleport:** Double-click on chart when dev panel is open → submarine teleports to clicked position. Uses new `s2w()` (screen-to-world) function in render-utils.js.

**Time compression:** 1×, 2×, 6×, 9× buttons above compass (top-right). Multiplies sim dt. Pulsing indicator when compressed.

### UI restructure

Tab renames and content reshuffled:
- WEAPONS: Tubes, Wire, VLS, TDC
- **SYSTEMS** (was BALLAST & TRIM): Trim, Masts (moved from WEAPONS), Status
- **PRIMARY CONTROL** (was DEPTH & SPEED): Engine Order, **SPD + Noise** (moved from Status), Depth Order, Posture, Emergency

Depth Order panel additions:
- **WATER** — water depth at current position (from bathymetry)
- **DUK** — depth under keel (red when <50m)

### Additional files created/modified
| File | Changes |
|------|---------|
| `tools/fetch-bathymetry.cjs` | Repeatable bathymetry fetch script |
| `src/config/locations/giuk-gap-bathymetry.json` | Real GEBCO depth grid (static) |
| `src/config/locations/giuk-gap.js` | Real bathymetry import, accurate SVP, corrected bounds |
| `src/render/render-utils.js` | Added s2w() screen-to-world function |
| `src/ui/input.js` | Dev teleport on double-click |
| `src/render/render-hud.js` | Time compression controls, session import |
| `src/main.js` | setHudPanel binding |
| `src/sim/index.js` | Time compression (dt × factor) |
| `src/state/session-state.js` | timeCompression state |
| `src/state/ui-state.js` | Tab key updated |
| `src/render/panels/render-command.js` | Tab renames, content reshuffled, drawSpdNoiseSection, DUK/water depth in depth panel |
| `docs/realism-overhaul/DATA-SOURCING.md` | Documented GEBCO API process |

### Phase 1 status: COMPLETE
All 14 breaking changes resolved (BC-001 to BC-014). Real GEBCO data. Phase 1 signed off.

**Next: Phase 2 — Ocean Environment Model** (SVP computation, CZ mapping, sea state, weather integration)

---

### Ocean model additions (from Jason's input)
- Full SVP structure: surface mixed layer, main thermocline, secondary thermoclines, halocline, deep isothermal, SOFAR channel
- CZ mapping from SVP geometry
- VLF penetration depth (~20m)
- Bottom type affects bottom bounce (rock/sand/mud/mixed)
- Ambient noise: sea state, shipping density, biologics, rain
- Diurnal variation (solar heating changes mixed layer depth)
- Acoustic absorption by frequency band (VLF travels far, HF attenuates)
- Ducting (surface duct, sub-surface duct)
- Bathymetry from GEBCO data (real seabed depth grid)
- Coastline from Natural Earth data
- Terrain collision / grounding with speed-dependent damage
- Continental shelves represented naturally by depth grid

---

## Session 3 — 2026-03-22: Phase 2 Implementation (Ocean Environment Model)

### What was done
- Created `src/systems/ocean-environment.js` — the complete ocean environment model
- SVP computation engine using Mackenzie (1981) equation
- Temperature-at-depth model: mixed layer → thermocline → secondary thermoclines → deep isothermal (exponential decay)
- Salinity-at-depth model: base 35 ppt with halocline perturbation (smooth tanh step)
- Full sound velocity profile curve computation (`computeSVPCurve`)
- SOFAR axis finder (depth of minimum sound velocity)
- Propagation model computing from SVP + water depth:
  - Direct path range (scaled by layer depth and sea state)
  - Surface duct range (enhanced range within mixed layer)
  - Convergence zone ranges (CZ1/CZ2/CZ3 — requires deep water + SOFAR below mixed layer)
  - Shadow zone boundaries (between direct path end and CZ1 start)
  - Bottom bounce range (from water depth × bottom reflectivity)
  - Absorption per nm by frequency band (VLF/LF/MF/HF — Thorp model)
  - VLF comms penetration depth (20m fixed)
- Ambient noise model:
  - Wind/wave noise from sea state (quadratic Wenz curve fit)
  - Shipping density noise from location data
  - Biologics noise (seasonal, from location data)
  - Rain noise (from precipitation state)
  - Total ambient noise (capped 0-1)
- Weather state:
  - Rolled from location seasonal ranges on scenario init
  - Wind speed/direction, sea state, precipitation, cloud cover, visibility
- Diurnal variation:
  - Mixed layer depth varies ±20% over 24-hour cycle
  - Cloud cover reduces solar heating effect
  - Time-of-day label (dawn/day/dusk/night)
  - Propagation recomputed only when layer depth changes >2m (performance guard)
- Query functions for sensors/AI:
  - `isBelowLayer(depth)` — is entity below the thermal layer?
  - `canReceiveVLF(depth)` — can sub receive VLF comms?
  - `propagationPath(srcDepth, rcvDepth, rangeNm, waterDepth)` — which path connects two entities?
  - `transmissionLoss(path, rangeNm, freqBand)` — dB loss for a given path/range/frequency
  - `bottomReflectivityAt(wx, wy)` — reflectivity at position
- Wired into sim loop:
  - `initEnvironment(location, season)` called in `resetScenario()` — loads SVP, rolls weather, computes propagation
  - `tickEnvironment(dt)` called every frame after `tickOcean()` — handles diurnal changes
- HUD additions to depth panel:
  - **LAYER** — thermal layer depth in metres (turns blue when sub is below layer)
  - **SEA ST** — current sea state number

### Files created
| File | Purpose |
|------|---------|
| `src/systems/ocean-environment.js` | Ocean environment model — SVP, propagation, ambient noise, weather, diurnal variation |

### Files modified
| File | Changes |
|------|---------|
| `src/sim/index.js` | Import ocean-environment, call initEnvironment in resetScenario, call tickEnvironment in update loop |
| `src/render/panels/render-command.js` | Import env/isBelowLayer, add LAYER and SEA ST readouts to depth panel, shift buttons down |

### Key design decisions

**D-RO-001 — Separate file from ocean.js:** Ocean terrain (bathymetry, grounding) stays in `ocean.js`. Water column physics (SVP, propagation, noise) goes in `ocean-environment.js`. This keeps terrain concerns separate from acoustic concerns. Both are called from the sim loop.

**D-RO-002 — Propagation recompute throttle:** Diurnal variation changes the mixed layer depth continuously, but propagation recompute is expensive. Only recompute when layer depth changes by >2m. This means propagation updates roughly every few sim-minutes, not every frame.

**D-RO-003 — Weather fixed per scenario:** Weather is rolled once on scenario init from location seasonal ranges. Dynamic weather is deferred to a future project (per open question #9 in DESIGN.md).

**D-RO-004 — CZ geometry from SOFAR axis:** CZ range scales linearly with SOFAR axis depth. Requires water depth >1500m AND SOFAR axis well below mixed layer. In winter at GIUK Gap (SOFAR near surface), no CZ forms — this is physically correct for high-latitude winter conditions.

### Build status
Clean build (Vite production, 77 modules). No errors.

### Additional changes
- Pressure readout uses bar (not atm) for consistency with other systems
- ENVIRONMENT section split out as its own panel in PRIMARY CONTROL tab (ACTUAL, ORDERED, WATER, DUK, LAYER, SEA ST, PRESSURE, TEMP)
- DEPTH ORDER section slimmed to controls only (arrows, PD, battery, snorkel)

### Phase 2 status: COMPLETE — signed off by Jason

---

## Session 3 (continued) — 2026-03-22: Phase 3 Implementation (Sonar Propagation Engine)

### What was done

**Core change:** Replaced the entire detection model. All sonar detection (player passive, towed array, active ping, enemy hearing) now uses the ocean propagation model from Phase 2 instead of hardcoded range thresholds.

#### SNR-based detection model
All detection now follows the sonar equation:
```
SNR = Source Level - Transmission Loss - Noise Level
```
Where:
- **Source Level** derives from entity noise (quiet sub ~110dB, noisy surface ship ~140dB)
- **Transmission Loss** computed by `transmissionLoss(path, rangeNm, freqBand)` using the propagation model — accounts for spreading loss, absorption, and path type (direct, duct, CZ, bottom bounce, shadow)
- **Noise Level** combines own-ship noise + ambient noise (wind, shipping, biologics, rain)

Detection probability is then derived from SNR vs threshold (-6dB for initial detection).

#### Dynamic thermal layer
- `inLayer()` and `layerPenalty()` in `ai/perception.js` now use `env.svp.mixedLayerDepth` instead of fixed `world.layerY1/Y2`
- Layer penalty scales with thermocline gradient strength: strong summer thermocline (-0.12°C/m) → 0.40 penalty, weak winter (-0.02°C/m) → 0.85 penalty. This means the layer is much more protective in summer than winter — physically correct.
- All references to `world.layerY1/Y2` replaced with dynamic layer depth (with fallbacks)

#### Hull passive sonar (`passiveUpdate`)
- Uses `propagationPath()` to determine which path connects source and receiver
- Uses `transmissionLoss()` with LF band for one-way loss
- Shadow zone contacts are skipped (no detection)
- CZ contacts detected at correct dynamic ranges from ocean environment
- Max detection range computed from propagation model (direct path + CZ + margin)
- Baffle dead arc, speed deafness, watch fatigue all preserved

#### Towed array (`towedArrayUpdate`)
- Same SNR model as hull but with:
  - +6dB sensitivity bonus (operational) / +0dB (damaged)
  - VLF band used for ranges >15nm (lower absorption = longer detection)
  - Lower self-noise masking (towed away from hull)
  - ~30% greater max range than hull array
- Dead cone, ambiguity resolution, mirror bearing all preserved

#### Active sonar (`activePing`)
- Source level 220dB, MF band (10-50kHz)
- Two-way propagation: 2× transmission loss (ping out + echo back)
- Target strength: subs ~15dB, surface ships ~20dB
- Detection threshold: echo must exceed 80dB
- Typical range: 10-20nm depending on conditions
- Datum range increased to ~40nm (one-way propagation at full source level)

#### Enemy hearing (`enemyMaybeHearPlayer`)
- Uses same propagation model as player sonar
- Enemy computes SNR of player noise at their position
- Shadow zone blocks enemy hearing too
- Enemy self-noise included in noise floor
- Baffle dead arc preserved

#### Depth strip HUD
- Layer line now driven by `env.svp.mixedLayerDepth` (single line, not band)
- Below-layer zone shaded lightly
- Layer label preserved

#### AI evasion layer exploitation
- `sim/index.js` evasion code uses dynamic `layerDepth` instead of `world.layerY1/Y2`
- `ai/tactics.js` ASW active ping uses dynamic layer depth

### Files modified
| File | Changes |
|------|---------|
| `src/systems/sensors.js` | Import ocean-environment + ocean. Rewrite passiveUpdate, towedArrayUpdate, activePing to use SNR model with propagation paths |
| `src/ai/perception.js` | Import ocean-environment + ocean. Rewrite inLayer, layerPenalty to use dynamic mixed layer depth + gradient-scaled penalty. Rewrite enemyMaybeHearPlayer to use propagation model |
| `src/ai/tactics.js` | Import ocean-environment. Use dynamic layer depth for ASW ping layer check |
| `src/sim/index.js` | Import env as oceanEnv. Use dynamic layer depth for evasion layer exploitation |
| `src/render/render-hud.js` | Import ocean-environment. Use dynamic layer depth for depth strip rendering |

### Key design decisions

**D-RO-005 — SNR-based detection replaces linear falloff:** The old model used `signal = noise × (1 - d/baseRange)` — a linear falloff with a hard cutoff. The new model computes actual transmission loss from spreading + absorption, producing physically realistic detection ranges that vary with propagation path, frequency band, and environmental conditions.

**D-RO-006 — Layer penalty scales with thermocline gradient:** Instead of a fixed 40% signal loss when crossing the layer, the penalty now scales with thermocline gradient strength. This means summer (strong thermocline) provides much better protection than winter (weak thermocline) — matching real-world operational experience.

**D-RO-007 — Towed array uses VLF band at long range:** Beyond 15nm, the towed array switches from LF to VLF absorption rates. VLF has almost zero absorption per nm, giving the towed array significantly longer detection range for low-frequency machinery tonals — this is what towed arrays are designed for.

**D-RO-008 — Active sonar two-way TL:** Active sonar requires the ping to travel to the target AND the echo to return — double the transmission loss. This naturally limits active range to ~10-20nm in typical conditions, compared to passive detection at 20-30nm+ via direct path or CZ.

### Build status
Clean build (Vite production, 77 modules). No errors.

---

## Session 3 (continued) — Tile-Based Thermocline System

### What was done

**Major new system:** Tile-based thermocline generation replaces the single global mixed layer depth. The thermocline now varies spatially across the operational area — the player "hunts for the layer."

#### GIUK SVP profiles updated
Seasonal profiles updated to match North Atlantic climatology (LAYER-GENERATION-GUIDANCE.md):
- Winter MLD: 400m → 260m (mid-range of 200-320m band)
- Spring MLD: 150m → 95m (mid-range of 60-130m)
- Summer MLD: 30m → 50m (mid-range of 30-70m)
- Autumn MLD: 80m → 125m (mid-range of 70-180m)
- Thermocline gradients adjusted to match temp drop / thickness ratios

#### Thermocline spawn parameters added to location data
Each season now specifies:
- `topDepthRange` — [min, max] metres
- `thicknessRange` — [min, max] metres
- `tempDropRange` — [min, max] °C total across thermocline
- `absentChance` — probability a tile has no layer (patchiness)

#### Tile system (`src/systems/thermocline-tiles.js`)
- Grid of ~27nm (50km) tiles covering the operational area
- Each tile independently generated with:
  - **Pass 1:** Absent check (seasonal patchiness), sample top depth/thickness/temp drop from normal distribution, correlation (thin→sharp, thick→diffuse)
  - **Pass 2:** Sea state modifier (deepens layer, weakens gradient, increases absent chance), zone modifier from local bathymetry, seabed clamp
- **Six zones** from water depth: shelf (<200m, always absent), ridge crest (300-500m, compressed), ridge flank (700-900m), channel (500-1000m), Iceland Basin (1500-2200m, full), Norwegian Sea (2000m+)
- **Bilinear interpolation** between tile centres for smooth transitions — no hard edges
- **Screen strength** from temp drop: >5°C = strong (1.0), 3-5°C = moderate (0.7), 1-3°C = weak (0.35), <1°C = absent
- Tiles requeried every ~2nm of player movement

#### Propagation now tile-driven
- `computePropagation()` queries `thermoclineAt(player.wx, player.wy)` for local tile data
- Layer depth, strength, thickness, temp drop all come from the interpolated tile
- Old global collapse rules replaced by per-tile generation rules
- Position-based recompute trigger added (every ~2nm movement)

### Key design decisions

**D-RO-009 — North Atlantic SVP data over high-latitude data:** Winter MLD reduced from 400m to 260m. The 400m value was from World Ocean Atlas at 63.5°N which is accurate but made the thermocline unusable over the ridge (622m avg depth). North Atlantic typical values (200-320m) are a small concession for much better gameplay — the thermocline now works realistically across all zones and seasons.

**D-RO-010 — Tile-based patchiness:** Thermocline varies spatially on ~50km tiles with bilinear interpolation. This creates realistic "hunting for the layer" behaviour. The patchiness probability from the guidance doc is per-tile, so in winter (40% absent) roughly 4 out of 10 tiles won't have a layer. The player may find the layer, then it thins, then a gap, then it reappears deeper. This is authentic Cold War submarine operational experience.

### Files created
| File | Purpose |
|------|---------|
| `src/systems/thermocline-tiles.js` | Tile-based thermocline generation, interpolation, zone/sea state modifiers |

### Files modified
| File | Changes |
|------|---------|
| `src/config/locations/giuk-gap.js` | Updated seasonal SVP profiles, added thermocline spawn parameters per season |
| `src/systems/ocean-environment.js` | Import tile system, generate tiles on init, query tiles in computePropagation, position-based recompute trigger |
| `src/render/render-hud.js` | Use tile bottom depth for thermocline band rendering |

### Build status
Clean build (Vite production, 78 modules). No errors.

### Additional fixes from testing

**Sonar detection recalibrated:** Source levels, noise floors, and array gain were all wrong. Quiet sub source level raised from 110→120dB, surface ship 140→155dB. Receiver noise lowered from 90→55dB. Added array gain: hull +25dB, towed +30dB, enemy 18-20dB. Detection now works at realistic ranges (18nm hull faint confirmed).

**Enemy speed display bug:** Debug label showed speed in raw wu/s (0.36 at 7kt → rounded to 0). Fixed to convert back to knots. Enemies were always moving — just the label was wrong.

**TMA baseline thresholds scaled for new world:** minBaseline 80→4, goodBaseline 350→18, maxBearingAge 150→600s, maxBearings 24→40. At realistic speeds (0.05 wu/s per knot), the old thresholds were unreachable before observations expired.

**Fire transient range scaled:** Was hardcoded 1800wu (~10nm old scale). Now 20nm in world units.

**Season selector added:** WIN/SPR/SUM/AUT buttons next to time compression for testing. Reinitialises ocean environment with new tiles and weather.

### Phase 3 status: COMPLETE — signed off by Jason

---

## Session 3 (continued) — Phase 4 Implementation (Torpedo Physics)

### What was done

**Torpedo speeds, ranges, and endurance scaled to real specs** using `submarine_stores_performance.md` reference data.

#### Torpedo performance (all types)

| Weapon | Sprint | Transit | Endurance | Arming | Wire Range | ECCM |
|--------|--------|---------|-----------|--------|------------|------|
| MK-48 ADCAP | 55kt | 40kt | 30 min | 12s (~350m) | ~15nm | High |
| Spearfish | 70kt | 40kt | 30 min | 10s (~380m) | ~15nm | Best |
| Tigerfish Mk24 | 35kt | 25kt | 30 min | 15s (~270m) | ~10nm | Poor |
| SST-4 / SUT | 35kt | 25kt | 30 min | 14s (~250m) | ~10nm | Moderate |

#### Missile performance

| Weapon | Speed | Range |
|--------|-------|-------|
| Harpoon | Mach 0.9 (24 wu/s) | 65nm |
| TASM | Mach 0.72 (20 wu/s) | 250nm |
| Exocet SM39 | Mach 0.93 (26 wu/s) | 27nm |

#### Bugs found and fixed during testing

**Torpedo launch velocity not converted:** `fireTorpedo()` in weapons.js used torpedo speed in knots directly as wu/s for initial velocity. A 55kt torpedo launched at 55 wu/s (≈1070kt equivalent). Fixed: multiply by KTS_TO_WU at launch.

**Torpedo enable distance too large:** `torpEnableDist: 300` was old world units (~1.6nm). Torpedo had to travel 1.6nm before seeker activated, eating 5+ minutes of endurance. Fixed: 300→16 wu (~160m).

**TDC lead angle calculation wrong:** Time-of-flight computed as `range_wu / speed_knots` instead of `range_wu / speed_wu_per_s`. Lead angle was ~19× too small. Fixed: convert torpedo speed to wu/s.

**Torpedo approach speed too slow:** At 18kt approach, MK-48 could only reach 9nm before fuel exhaustion — well short of the 27nm real range. Real torpedoes transit at 35-40kt, not creep speed. Fixed: approach speeds raised to 25-40kt.

**Missile speeds wrong unit:** Missile speed was set in km/h but missile.js treats it as wu/s. Recalculated to correct wu/s values (Mach 0.9 = 24 wu/s).

**Missile seeker ranges scaled:** Seeker activate range and search range updated from old world units to new scale (~2nm activate, ~3nm search).

**Wire max range updated:** 3000→2780 wu (~15nm).

**Ping dazzle range scaled:** 1800→370 wu (~2nm).

### Files modified
| File | Changes |
|------|---------|
| `src/config/constants.js` | All torpedo stats (speed, life, arming, approach, seduceRange, enableDist, wireMaxRange, pingDazzle), all missile stats (speed, range), default torpedo config |
| `src/config/vessels.js` | torpEnableDist, torpWireMaxRange |
| `src/systems/weapons.js` | KTS_TO_WU conversion on torpedo launch velocity |
| `src/systems/missile.js` | Seeker constants scaled (activate range, search range, hit radius, timeout) |
| `src/sim/index.js` | TDC lead angle: torpedo speed converted to wu/s for TOF calc |
| `src/render/index.js` | Enemy debug label: speed converted from wu/s to knots |

### Known issues (deferred)
- **Tube auto-reload:** Tubes auto-reload with torpedo after firing. Should stay empty until ordered. Low priority — doesn't affect testing.
- **Player feels overpowered:** Expected — AI hasn't been overhauled for realistic ranges yet (Phase 5).

### Phase 4 status: COMPLETE — signed off by Jason

**Next: Phase 5 — AI Overhaul** (AI detects, tracks, and engages at realistic ranges using the same sonar/propagation model as the player)

---

## Session 3 (continued) — Phase 5 Implementation (AI Overhaul)

### What was done

**Major system replacement:** The suspicion-threshold AI state machine was replaced with a contact-classification-driven system mirroring real submarine doctrine.

#### Contact Classification System
New `contactState` field on all enemy entities progresses through:
- **NONE** → **DETECTION** (first bearing) → **CLASSIFIED** (3+ bearings, 15s, TMA≥0.10) → **IDENTIFIED** (5+ bearings, 45s, TMA≥0.18) → **TRACKING** (TMA≥role threshold)
- Degradation: quality drops → revert one level. Staleness (no observations for 5-20 min) → gradual revert.
- Instant promotions: incoming torpedo → IDENTIFIED, active ping return → CLASSIFIED, datum share → DETECTION
- `evaluateContactState(e)` runs each frame, `promoteContactState(e, minState)` for external promotions
- Give-up timers realistic: 10 min at DETECTION, 15 min at CLASSIFIED, 20 min at IDENTIFIED

#### Cheats Removed (3)
- **Patrol heading:** Was biased 60% toward player's true position. Now random patrol legs.
- **Interceptor:** Was projecting player's true heading/speed for intercept. Now uses own TMA data.
- **Counter-fire (2 locations):** Was firing at player's true position with blur. Now fires on own contact + TMA.

#### Enemy Constants Scaled
- Torpedo life: 180s → 1800s (30 min). Approach speed: 14kt → 30kt. Reload: 40s → 55s.
- Surface torpedo life: 90s → 1200s.
- Fire rate: 1-2s → 8-15s (deliberate shots). Counter-fire reaction: 2-4s → 8-15s.
- Contact max age: 20s → 120s. Fire max age: 14s → 90s.
- Sub noise floor: 0.62-0.90 → 0.15-0.45 (quieter but still noisier than NATO).
- ASROC range: 15nm → 5nm. Fire transient range: 10nm → 20nm.
- Patrol speed: 7kt → 5kt (need to listen).

#### Layer-Aware Patrol Depth
- Patrol: subs choose depth below thermocline when layer exists
- Engage: stay just below layer for concealment
- SSBNs: deep regardless (250-450m)

#### Listening Stops
- Every 3-5 minutes during patrol, enemy comes to 2-3kt for 60-120s
- Dedicated listening windows where self-noise is minimal
- Gives enemy regular detection opportunities against quiet contacts

#### Enemy Self-Noise Model Fixed
- Below 6kt: machinery floor only (58dB Soviet). No flow noise penalty.
- Above 6kt: flow noise kicks in at 3.5dB/kt
- Previously: linear 2.5dB/kt from 0kt — made enemies deaf during normal patrol

#### Bearing Noise Fixed (SNR-Based)
- Old: distance-based formula `(80 + d*0.10) / d` = constant ~6-10° noise regardless of signal strength
- New: SNR-based. Strong signal → ±1°, faint → ±8°. Both hull and towed array updated.
- Towed array tighter than hull (0.5° to 5.5° — longer aperture)
- dB arithmetic fixed: baffle/deafness penalties now added in dB, not multiplied linearly

#### Depth Estimation Smoothed
- SOLID: ±20m noise (was ±80m), 92/8 blend (was 70/30), rounds to 10m
- DEGRADED: ±60m noise (was ±200m), 90/10 blend (was 60/40)
- Stabilises within 30s instead of bouncing permanently

#### Wire-Guided Torpedo Depth Steering
- Wire guidance now updates torpedo `depthOrder` from TDC depth estimate
- Smoothed: 5% blend toward new estimate, only applies when shift > 20m
- Wire guidance lead angle: TOF capped at 300s, lead capped at ±8.5°
- Cross-track correction: corrGain scaled for new world, max correction ±10°

#### TDC Fixes
- Speed display: converted from wu/s to knots
- Course estimate: uses `_estHeading` from bearing-rate solver when available
- Intercept bearing lead: capped at ±7°, TOF capped at 300s
- TMA crossing angle threshold: 25° → 12° (tighter bearings need less crossing)
- Straight-leg floor: raised to 0.40 (patient tracking can reach DEGRADED)

#### Bearing-Rate Range Removed
- Bearing-rate passive range estimation completely removed — inherently unstable at realistic ranges
- Range now solely from cross-bearing triangulation (requires manoeuvre) and active ping

### Known Issues (deferred to separate project)
- **Range estimation unreliable:** Cross-bearing triangulation needs minimum 500m baseline and good crossing angle. At realistic ranges with slow movement, takes several minutes to produce a value. Needs dedicated rework — possibly a different approach entirely.
- **Tube auto-reload:** Still auto-reloads with torpedo after firing.

### Files created
| File | Purpose |
|------|---------|
| (none — all changes to existing files) | |

### Files modified
| File | Changes |
|------|---------|
| `src/config/constants.js` | Added `classification` block. Scaled enemy weapon/contact/fire constants. |
| `src/ai/spawn.js` | Added `contactState`, `contactStateT`, `firstDetectionT` to all spawn functions |
| `src/ai/perception.js` | Added `evaluateContactState()`, `promoteContactState()`. Updated `enemyHasFireSolution`, `enemyUpdateContactFromPing`, `enemyMaybeHearPlayer` (self-noise model, suspicion gain). Fixed contact age to use simT. |
| `src/ai/index.js` | Exported new functions |
| `src/ai/tactics.js` | Updated wolfpack/hunt/share/active sonar gates to use contactState |
| `src/sim/index.js` | Replaced state computation with contactState mapping. Updated all suspicion threshold reads (~10 locations). Added listening stops. Layer-aware patrol depth. Torpedo detection promotes contactState. |
| `src/sim/scenario.js` | Group state uses contactState instead of suspicion |
| `src/systems/sensors.js` | SNR-based bearing noise (hull + towed). Depth estimation smoothed. Bearing-rate range removed. Cross-bearing triangulation baseline gate. broadcastTransient promotes contactState. Fixed dB arithmetic. |
| `src/systems/weapons.js` | Wire depth steering (smoothed). Wire lead angle capped. Cross-track correction scaled. Wire TOF uses wu/s. |
| `src/render/render-hud.js` | Threat bar uses contactState rank. Season selector added. |
| `src/render/index.js` | Debug overlay shows contactState label. |

### Key design decisions

**D-RO-013 — Contact classification replaces suspicion thresholds:** AI state machine now driven by NONE/DETECTION/CLASSIFIED/IDENTIFIED/TRACKING progression that mirrors real submarine doctrine (detect → classify → identify → prosecute). Suspicion float retained as secondary aggressiveness modifier but no longer drives state transitions.

**D-RO-014 — No cheats policy:** All direct reads of player.wx/wy for AI decision-making removed. AI uses only its own sensor data (bearings, TMA, contact position). Patrol headings random. Interceptor uses TMA estimate. Counter-fire on own bearing.

**D-RO-015 — SNR-based bearing noise:** Bearing accuracy driven by signal quality, not distance formula. Strong signal = tight bearing (±1°), faint = loose (±8°). This naturally produces accurate bearings at close range and noisy ones at long range, scaling with actual detection quality.

**D-RO-016 — Bearing-rate range removed:** The formula `R = ownSpeed × sin(θ) / bearingRate` is inherently unstable at realistic ranges where bearing rate is tiny. Removed entirely. Passive range now solely from cross-bearing triangulation. Range estimation needs a dedicated rework as a separate project.

### Build status
Clean build (Vite production, 78 modules). No errors.

### Phase 5 status: COMPLETE — pending testing sign-off

**Next: Phase 6 — Scenario Redesign** (rebuild scenarios for realistic scale) or range estimation rework
