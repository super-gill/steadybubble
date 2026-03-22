# GIUK Thermocline Spawn Rules

Parametric system for cold war submarine simulation. Four variables define each thermocline instance:

**top depth · thickness · gradient strength · patchiness**

---

## Seasonal Base Values

### Winter (Dec–Feb)

| Parameter | Value |
|---|---|
| Top depth | 200–320 m |
| Thickness | 20–60 m |
| Temp drop | 0.5–2 °C |
| Patchiness | HIGH — 40% chance absent |
| Acoustic screen | Minimal / none |

- Storm-driven mixing dominates
- Layer is highly unreliable — treat as absent unless explicitly present
- After sustained SS7+, push top depth toward 300–320 m and halve thickness

---

### Spring (Mar–May)

| Parameter | Value |
|---|---|
| Top depth | 60–130 m |
| Thickness | 40–90 m |
| Temp drop | 2–5 °C |
| Patchiness | MEDIUM — 20% chance absent |
| Acoustic screen | Moderate, building |

- Layer is developing — values should trend toward summer norms as the season progresses
- High variability early in the season (March); more consistent by May

---

### Summer (Jun–Aug)

| Parameter | Value |
|---|---|
| Top depth | 30–70 m |
| Thickness | 80–160 m |
| Temp drop | 4–8 °C |
| Patchiness | LOW — 5% chance absent |
| Acoustic screen | Strong, reliable |

- Best conditions for submarine concealment
- Shadow zone below the layer can extend several hundred metres in deep water
- SOFAR channel accessible below ~600 m in Iceland Basin and Norwegian Sea

---

### Autumn (Sep–Nov)

| Parameter | Value |
|---|---|
| Top depth | 70–180 m |
| Thickness | 50–120 m |
| Temp drop | 2–6 °C |
| Patchiness | MEDIUM-HIGH — 25% chance absent |
| Acoustic screen | Good but degrading |

- Layer erodes as the season progresses — values trend toward winter norms
- Storm events can temporarily collapse the layer; it may partially recover between storms
- High storm risk from October onward; apply sea state modifiers frequently

---

## Zone Modifiers

Apply these on top of the seasonal base values, based on local bathymetry.

| Zone | Water depth | Top depth mod | Thickness mod | Special rule |
|---|---|---|---|---|
| Iceland Basin | 1500–2200 m | no mod | no mod | SOFAR channel accessible in summer below 600 m |
| Norwegian Sea | 2000–3000 m | −10 m (slightly deeper) | no mod | Colder base water — temp drop slightly larger |
| Ridge W flank | 700–900 m | +20 m | −20% | Shadow zone floor rises — check seabed clearance |
| Ridge crest | 300–500 m | layer may not fit | clamp: max = seabed − top − 20 m | If seabed < thermocline bottom → layer absent |
| Faroe–Shetland Ch. | 500–1000 m | +15 m | −15% | Atlantic inflow warms deep layer — reduced gradient |
| Shallow shelf (<200 m) | <200 m | N/A | N/A | No thermocline — fully mixed year-round in GIUK |

### Ridge crest seabed clamp rule

```
thermocline_bottom = top_depth + thickness

if thermocline_bottom >= seabed_depth - 20:
    thickness = seabed_depth - top_depth - 20
    
if thickness < 15:
    layer = ABSENT
```

---

## Sea State Modifier

Applied per-scenario on top of seasonal + zone values.

| Sea state | Mixed layer deepens by | Gradient strength × | Patchiness mod |
|---|---|---|---|
| SS 1–2 | no change | ×1.0 | −5% absent chance |
| SS 3–4 | +20–40 m | ×0.85 | no change |
| SS 5–6 | +60–100 m | ×0.60 | +15% absent chance |
| SS 7–8 | +100–180 m | ×0.30 | +30% absent chance |
| SS 9+ | +180–250 m | ×0.10 | layer effectively absent |

Note: "Mixed layer deepens by X" means the top depth of the thermocline increases by X — the layer is pushed further down by wave mixing energy.

---

## Acoustic Effectiveness

Convert the final effective temperature drop into a game mechanic.

| Effective temp drop | Screen quality | Suggested game effect |
|---|---|---|
| >5 °C | Strong | Active sonar range ×0.25 below layer; passive −12 dB |
| 3–5 °C | Moderate | Active sonar range ×0.50 below layer; passive −8 dB |
| 1–3 °C | Weak | Active sonar range ×0.75 below layer; passive −3 dB |
| <1 °C | Absent | No effect — full sonar propagation |

---

## Implementation Notes

### Generation order (two-pass system)

**Pass 1 — Seasonal base**

1. Roll absent check first using seasonal patchiness probability. If absent, skip to next tile.
2. Sample top depth from seasonal range using normal distribution (mean = midpoint of range, SD = range / 6).
3. Sample thickness the same way.
4. Thickness and gradient are correlated — if thickness is thin (lower quartile of range), push gradient toward stronger end; if thick, push toward weaker end.

**Pass 2 — Apply modifiers in order**

1. Apply zone modifier (depth and thickness adjustments).
2. Apply sea state modifier (deepens top depth, multiplies gradient strength, adds to absent chance).
3. Apply seabed clamp (truncate thickness if layer would extend into seabed).
4. If final thickness < 15 m or gradient < 1 °C, mark layer as acoustically absent.

---

### Patchiness as horizontal variation

Patchiness is a **horizontal** property, not a binary present/absent toggle.

- Generate one thermocline instance per ~50×50 km tile
- Interpolate thermocline parameters (top depth, thickness, gradient) between adjacent tiles over ~10–20 km transition zones
- A hard edge between absent and present tiles is unrealistic — always blend
- This creates the realistic "hunting for the layer" behaviour where a submarine may find the layer present, then thinning, then a gap, then present again slightly deeper

---

### Correlation rules (thickness ↔ gradient)

| Thickness rolled | Gradient adjustment |
|---|---|
| Lower quartile of range (thin) | ×1.3 on gradient strength |
| Middle 50% | ×1.0 (no adjustment) |
| Upper quartile (thick) | ×0.7 on gradient strength |

Thin sharp layers are acoustically more potent than thick diffuse ones.

---

### The permanent deep thermocline

A permanent thermocline always exists in deep zones (Iceland Basin, Norwegian Sea) at 500–900 m depth. It should be present in the simulation but is acoustically irrelevant as a tactical screen — submarines cannot practically sit above it at those depths. It does affect very long-range passive sonar propagation modelling if you implement convergence zones.

---

## Quick Reference — GIUK Winter SS7 (worst case)

The most demanding scenario for the simulation:

- Top depth: 250–320 m (seasonal base 200–320 m, plus SS7 adds +100–180 m — capped at realistic max)
- Thickness: 20–40 m (seasonal base, then ×0.30 gradient multiplier)
- Effective gradient: ~0.5–1 °C
- Absent probability: 40% (seasonal) + 30% (SS7) = **effectively absent in most tiles**
- Ridge crest: **always absent** — seabed at 300–500 m is above or touching the storm-mixed layer base
- Iceland Basin: weak layer may persist at 280–320 m but provides minimal acoustic screening
- Tactical summary: submarines transiting the ridge crest in this condition are fully acoustically exposed for ~80–100 km of the crossing