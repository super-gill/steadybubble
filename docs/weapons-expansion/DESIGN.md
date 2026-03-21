# Weapons Expansion — Design Document

**Date:** 2026-03-21
**Status:** PLANNING
**Scope:** Implement all placeholder weapons and add new weapon mechanics (mines, land-attack, standoff ASW).

---

## 1. Current Weapon Status

### Fully Implemented (functional in-game)

| Key | Name | Kind | Used By | Notes |
|-----|------|------|---------|-------|
| `mk48_adcap` | MK-48 ADCAP | Torpedo | 688, 688i, Seawolf | Wire-guided, active/passive seeker |
| `spearfish` | SPEARFISH | Torpedo | Trafalgar, Swiftsure | 70+ kt, superior ECCM |
| `tigerfish` | TIGERFISH Mk 24 | Torpedo | Swiftsure | 35 kt, 1970s-era |
| `sst4` | SST-4 / SUT | Torpedo | Type 209 | German export torpedo |
| `harpoon` | UGM-84 HARPOON | Missile | 688, Seawolf | Tube-launched anti-ship |
| `sub_harpoon` | UGM-84 SUB-HARPOON | Missile | Trafalgar, Swiftsure | RN variant of Harpoon |
| `tasm` | BGM-109B TASM | Missile | 688, Seawolf | Anti-ship cruise missile, tube + VLS |
| `sm39` | SM39 EXOCET | Missile | Type 209 | Tube-launched, deep launch (55m) |

### Placeholder (in loadout screen but not functional)

| Key | Name | Kind | Used By | Priority | Implementation Notes |
|-----|------|------|---------|----------|---------------------|
| `tlam` | BGM-109 TLAM | Missile | 688i, Trafalgar, Seawolf | Medium | Land-attack — needs target system (no anti-ship seeker). GPS/INS guidance. Could target shore installations if map supports it. |
| `subroc` | UUM-44 SUBROC | Missile | 688, Seawolf | Low | Nuclear depth bomb at standoff range. Retired early 1990s. Ballistic flight, no guidance after launch. Massive blast radius. |
| `mk67_slmm` | MK-67 SLMM | Mine | 688, 688i, Seawolf | High | Submarine-launched mobile mine. Propelled to target area, settles on seabed. Simplest to implement — fire-and-forget torpedo that stops and becomes a stationary threat. |
| `mk60_captor` | MK-60 CAPTOR | Mine | 688, 688i, Seawolf | High | Encapsulated torpedo mine. Bottom mine containing Mk 46 torpedo. Detects passing submarines, launches torpedo autonomously. Very interesting mechanic — mine + AI torpedo. |
| `stonefish` | STONEFISH | Mine | Trafalgar, Swiftsure | High | RN influence mine. Bottom mine, detonates on magnetic/acoustic signature. Similar to SLMM but no propulsion phase. |

---

## 2. New Weapon Categories Needed

### 2.1 Mines
Mines are a new weapon category requiring new game mechanics:
- **Deployment:** launched from torpedo tube, swims/sinks to position
- **Behaviour:** stationary after deployment, detects targets passively
- **Types:**
  - **Bottom mine** (Stonefish, SLMM): sits on seabed, detonates on influence (magnetic/acoustic)
  - **Encapsulated torpedo** (CAPTOR): sits on seabed, launches a torpedo at detected target
- **Player interaction:** deploy in a patrol area, mines are autonomous after that
- **Rendering:** mine icons on tactical display, detection radius visualisation
- **AI awareness:** enemy submarines can detect and avoid mines (or not)

### 2.2 Land-Attack
TLAM requires:
- **Land targets:** shore installations, ports, or strategic targets on the map edge
- **No anti-ship capability:** TLAM cannot target ships
- **Fire-and-forget:** no wire guidance, GPS/INS flight path
- **Scoring:** points for successful strikes
- **Map support:** designated strike targets visible on tactical display

### 2.3 Standoff ASW
SUBROC requires:
- **Ballistic flight:** launches from tube, flies above surface, re-enters water at target area
- **Nuclear depth bomb:** massive blast radius, kills everything in area
- **No guidance after launch:** player sets target bearing and range, weapon flies there
- **Collateral:** affects own submarine if too close
- **Historical context:** retired weapon, Cold War flavour

---

## 3. Non-Weapon Payloads (Future)

Mentioned by Jason as future plan — not weapons but tube-launched:

| Payload | Description | Status |
|---------|-------------|--------|
| MOSS | Mobile Submarine Simulator — acoustic decoy that mimics submarine signature | Not yet defined |
| NMRS | Near-term Mine Reconnaissance System — UUV for mine detection | Not yet defined |
| UUV | Unmanned Underwater Vehicle — various reconnaissance payloads | Not yet defined |

---

## 4. Implementation Priority

| Priority | Weapons | Why |
|----------|---------|-----|
| **1 — High** | SLMM, CAPTOR, Stonefish | Mines add a new tactical dimension. SLMM is simplest (propelled bottom mine). CAPTOR is most interesting (mine + torpedo). All three are similar mechanically. |
| **2 — Medium** | TLAM | Requires map/target infrastructure but adds strategic depth. VLS makes it impactful on 688i. |
| **3 — Low** | SUBROC | Retired weapon, niche use case. Interesting mechanic but limited tactical value vs current enemy set. |
| **4 — Future** | MOSS, NMRS, UUVs | Non-weapon payloads, separate project scope. |

---

## 5. Implementation Phases

### Phase 1 — Mine Framework
- Mine entity type (position, depth, state, detection radius)
- Mine deployment from torpedo tube (fire-and-forget, swims to target bearing/range, settles)
- Bottom mine behaviour (passive detection, detonation)
- Tactical display rendering (mine icons, detection circles)
- AI mine avoidance (basic)
- Implement: SLMM, Stonefish

### Phase 2 — CAPTOR Mine
- Encapsulated torpedo: mine detects target, launches Mk 46 torpedo
- Mk 46 lightweight torpedo (new weapon — smaller, shorter range than Mk 48)
- Mine-launched torpedo AI (autonomous, no wire)

### Phase 3 — Land-Attack (TLAM)
- Strike target system (map targets, scoring)
- TLAM flight model (tube or VLS launch, GPS/INS cruise)
- No anti-ship capability enforcement
- Mission briefing: assigned strike targets

### Phase 4 — Standoff ASW (SUBROC)
- Ballistic flight model (above-surface trajectory)
- Nuclear depth bomb blast mechanics
- Range/bearing targeting (no guidance after launch)

---

## 6. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Mine detection radius — how far should a mine detect a passing submarine? | ⬜ Awaiting Jason |
| 2 | Mine lifetime — do mines persist indefinitely or have a battery/timer? | ⬜ Awaiting Jason |
| 3 | CAPTOR's Mk 46 — should this be a new torpedo type or reuse existing torpedo physics? | ⬜ Awaiting Jason |
| 4 | TLAM targets — are these pre-defined map features or player-designated waypoints? | ⬜ Awaiting Jason |
| 5 | SUBROC blast radius — how large? Does it affect the player's own submarine? | ⬜ Awaiting Jason |
| 6 | Can enemy submarines deploy mines? | ⬜ Awaiting Jason |
| 7 | MOSS decoy — same tube as weapons? Separate loadout category? | ⬜ Awaiting Jason |
