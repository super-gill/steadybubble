# Vessel Individuality Upgrade — Design Document

**Date:** 2026-03-21
**Status:** Phases 1-4 IMPLEMENTED. All 6 submarines have real schematic-based layouts. Magazine rack, loadout screen, and weapon system complete. D008-D016 logged. Phases 5-7 remaining (comms, differentiators, balance tuning).
**Scope:** Make each submarine class feel mechanically and visually distinct through unique compartment layouts, crew complements, watch roles, DC panel outlines, weapon magazine mechanics, and pre-mission loadout.

---

## 1. Overview

Currently all five playable submarines share identical internal layouts (6 WTS, same rooms, same 90-person crew, same watch roles, same DC panel outline). The only differentiation is through vessel config values in `vessels.js` (speed, depth, weapons, noise).

This upgrade gives each submarine its own:
- **Compartment layout** — vessel-specific watertight sections, rooms, and systems placement based on real submarine schematics
- **Crew complement** — realistic crew size with nation-appropriate roles and terminology
- **DC panel outline** — unique hull silhouette showing the actual submarine shape
- **Watch roles** — nation-specific watchkeeper positions and abbreviations
- **Magazine & tube mechanics** — realistic weapon stowage with tube swap restrictions
- **Pre-mission loadout** — player chooses rack contents and tube pre-loads before the scenario
- **External equipment** — systems outside the pressure hull (bow array, VLS, propshaft) tracked separately from internal compartments

---

## 2. Crew Complements

| Class | Real Crew | Game Crew | Per Watch (~half) | Duty/Supernumerary |
|-------|-----------|-----------|--------------------|--------------------|
| Los Angeles (688i) | ~130 | **130** | ~58 | ~14 |
| Trafalgar | ~130 | **130** | ~58 | ~14 |
| Swiftsure | ~116 | **116** | ~51 | ~14 |
| Seawolf | ~140 | **140** | ~62 | ~16 |
| Type 209 | ~33-36 | **35** | ~14 | ~7 |

**Design principle:** We only need to define watchkeeper positions for half the crew. Each position exists twice (Watch A and Watch B) except for duty personnel (CO, XO, department heads, medical, supply) who are always available.

### Crew Impact on Gameplay

| Class | Crew Loss Tolerance | DC Capacity | Notes |
|-------|--------------------:|-------------|-------|
| Seawolf (140) | High | 2 large teams | Can absorb significant casualties |
| Dallas (130) | High | 2 standard teams | Balanced |
| Trafalgar (130) | High | 2 standard teams | Balanced |
| Swiftsure (116) | Medium | 2 standard teams | Slightly less resilient |
| Type 209 (35) | **Very Low** | TBD | Losing 5 crew is catastrophic |

---

## 3. Compartment Layouts

### 3.1 Key Architectural Change: Realistic WTS Counts

Real submarines have far fewer watertight bulkheads than the current game model (6 WTS). Watertight bulkheads are massive full-pressure-rated structural members — submarines typically have only 2-3 of them. Internal divisions between compartments within a WTS are non-watertight bulkheads.

**The current 6 WTS model is being replaced with vessel-specific WTS counts based on real submarine schematics.** The LA class, for example, has 3 WTS.

This is a major architectural change. The number of WTS, their size, and their contents vary per vessel class.

### 3.2 Pressure Hull vs External Equipment

Each vessel has two zones:

**Inside the pressure hull:** Crew-accessible watertight sections. Subject to flooding, fire, crew casualties, and DC team operations. This is what the DC panel displays.

**External to the pressure hull:** Equipment mounted outside the pressure hull envelope. Not crew-accessible. Cannot have fires or crew casualties. Can be damaged by weapon hits but are not "rooms" in the DC sense.

External equipment varies per class:
- **Bow array** (sonar dome) — all vessels
- **VLS cells** — 688i VLS variant only
- **Propshaft / propulsor** — all vessels
- **Towed array housing** — vessels with towed array

External systems are damaged by weapon impact severity, not by internal compartment state (flooding/fire don't affect them). They are rendered on the DC panel outline but outside the hull boundary.

### 3.3 Layout Specification Process

Jason provides schematic images of each vessel. Claude translates these into the room grid / systems placement format. Jason reviews and confirms.

**Status:**

| Vessel | Schematic Received | Layout Specified | Layout Reviewed | Implemented |
|--------|:---:|:---:|:---:|:---:|
| USS Dallas — 688 (Flight I) | ✅ | ✅ See Section 3.5 | ✅ Confirmed | ⬜ |
| USS Providence — 688i (Improved) | ✅ | ✅ (identical to 688 + external VLS) | ✅ Confirmed | ⬜ |
| HMS Trafalgar | ⬜ | ⬜ | ⬜ | ⬜ |
| HMS Swiftsure | ⬜ | ⬜ | ⬜ | ⬜ |
| USS Connecticut (Seawolf) | ⬜ | ⬜ | ⬜ | ⬜ |
| U-36 (Type 209) | ⬜ | ⬜ | ⬜ | ⬜ |

### 3.4 Layout Terminology

These terms are used throughout all vessel layout specifications:

| Term | Definition |
|------|-----------|
| **Unit** | One cell in the schematic grid (1 column x 1 row) |
| **Compartment** | A 4-unit x 2-unit space (4 columns wide, 2 rows tall = one deck height) |
| **Watchspace** | One or more compartments forming a named room (e.g. Control Room, Torpedo Room) |
| **Watertight Section (WTS)** | A collection of watchspaces between watertight bulkheads |
| **External** | Equipment outside the pressure hull — does not follow compartment sizing |

Fire spreads between adjacent watchspaces within a WTS. Watertight bulkheads block fire and flooding between WTS. Crew transit between WTS requires passing through WTDs (or RC tunnel bypass on nuclear boats).

### 3.5 Los Angeles Class (688i) — Layout Specification

**Source:** Schematic image provided by Jason, 2026-03-20. Confirmed cell-by-cell 2026-03-20.

**Watertight Sections:** 3 (separated by 2 watertight bulkheads)

**External Equipment (outside pressure hull):**
- Propshaft (stern)
- VLS (if fitted — 688i-VLS variant only)
- Bow Array (bow)

---

#### WTS 1 — Forward Compartment

**Grid reference:** Columns AB-AQ, Rows 5-11
**Size:** 4 compartments wide x 3 decks tall = **12 compartments, 10 watchspaces + battery**
**Description:** The largest section. Contains torpedo room, control room, sonar, comms, crew messes, wardroom, auxiliary machinery, emergency diesel, and the battery. Most of the crew (~72%) is stationed here.

**Watchspace Grid:**

| Deck | Col AB-AE | Col AF-AI | Col AJ-AM | Col AN-AQ |
|------|-----------|-----------|-----------|-----------|
| Upper (R5-6) | Comms (1 comp) | Control Room (1 comp) | Sonar Room (1 comp) | Computer Room (1 comp) |
| Mid (R7-8) | Diesel Engines (1 comp) | Crew Mess (2 comp) | *(cont.)* | Wardroom (1 comp) |
| Lower (R9-10) | Aux Machinery Space (1 comp) | Crew Mess (1 comp) | Torpedo Room (2 comp) | *(cont.)* |
| Sub-deck (R11) | Battery (spans full section width) | | | |

**Watchspace Summary — WTS 1:**

| # | Watchspace | Compartments | Grid Position | Notes |
|---|-----------|-------------|---------------|-------|
| 1 | Comms | 1 | AB-AE, R5-6 | Radio/communications, manned |
| 2 | Control Room | 1 | AF-AI, R5-6 | Helm, fire control, ballast, navigation, periscope |
| 3 | Sonar Room | 1 | AJ-AM, R5-6 | Sonar array operators, manned |
| 4 | Computer Room | 1 | AN-AQ, R5-6 | TMA computer, fire control computers |
| 5 | Diesel Engines | 1 | AB-AE, R7-8 | Emergency diesel generator |
| 6 | Crew Mess (mid) | 2 | AF-AM, R7-8 | Galley and mess seating, spans 2 compartments |
| 7 | Wardroom | 1 | AN-AQ, R7-8 | Officers' quarters and mess |
| 8 | Aux Machinery Space | 1 | AB-AE, R9-10 | CO2 scrubbers, O2 generator, aux power |
| 9 | Crew Mess (lower) | 1 | AF-AI, R9-10 | Crew berthing / additional mess space |
| 10 | Torpedo Room | 2 | AJ-AQ, R9-10 | 4 tubes, weapon stowage (magazine rack), spans 2 compartments |
| 11 | Battery | spans | AB-AQ, R11 | Battery bank running under the lower deck |

**Masts:** Located above Control Room / Sonar Room area (columns AJ-AK, R2-3)

**Systems in WTS 1:** *(to be detailed — covers torpedo tubes, sonar, fire control, helm, ballast, navigation, periscope, comms, CO2/O2, aux power, emergency diesel, battery, weapon stowage, sickbay)*

---

#### WTS 2 — Reactor Compartment

**Grid reference:** Columns V-Y, Rows 5-10
**Size:** 1 compartment wide x 3 decks — **2 watchspaces** (non-standard compartment sizing)
**Description:** Small isolated section. Minimal crew — reactor watchkeepers only. RC Tunnel provides crew transit bypass above the reactor.

**Watchspace Grid:**

| Deck | Col V-Y |
|------|---------|
| Upper (R5-6) | RC Tunnel (1 compartment) |
| Mid-Lower (R8-10) | Reactor Compartment (spans 2 decks, non-standard) |

**Watchspace Summary — WTS 2:**

| # | Watchspace | Compartments | Grid Position | Notes |
|---|-----------|-------------|---------------|-------|
| 1 | RC Tunnel | 1 | V-Y, R5-6 | Crew transit passage. Bypass — crew transit never blocked even when WTDs closed. |
| 2 | Reactor Compartment | ~2 (non-standard) | V-Y, R8-10 | Reactor, primary coolant, pressuriser. Spans 2 deck heights. No-evac zone (radiation boundary). |

**Systems in WTS 2:** *(to be detailed — reactor, primary coolant, pressuriser, radiation monitoring)*

---

#### WTS 3 — Engineering

**Grid reference:** Columns G-S, Rows 5-10
**Size:** ~3 compartments wide x 3 decks — **4 watchspaces**
**Description:** Everything aft of the reactor. One massive open engineering space containing all propulsion and electrical generation equipment, plus three smaller watchspaces on the forward side.

**Watchspace Grid:**

| Deck | Col G-P (main space) | Col Q-S |
|------|---------------------|---------|
| Upper (R5-6) | Engineering (multi-deck) | Maneuvering (1 comp) |
| Mid (R7-8) | *(cont.)* | Electrical Distribution (1 comp) |
| Lower (R9-10) | *(cont.)* | Machinery (1 comp) |

**Watchspace Summary — WTS 3:**

| # | Watchspace | Compartments | Grid Position | Notes |
|---|-----------|-------------|---------------|-------|
| 1 | Engineering | ~6 (multi-deck open space) | G-P, R5-10 | No internal bulkheads. Turbines, gearbox, turning gear, propulsion machinery. Spans all 3 decks. |
| 2 | Maneuvering | 1 | Q-S, R5-6 | Throttle, reactor plant control panels. Manned watchstation. |
| 3 | Electrical Distribution | 1 | Q-S, R7-8 | Electrical generation and distribution switchboards. |
| 4 | Machinery | 1 | Q-S, R9-10 | Additional machinery and mechanical systems. |

**Systems in WTS 3:** *(to be detailed — propulsion, main turbines, electrical distribution, steering, aft planes hydraulics, shaft seals)*

---

#### 688i External Equipment (outside pressure hull)

| Equipment | Grid Position | Vessel Variant | Notes |
|-----------|--------------|----------------|-------|
| Propshaft | B-F, R6-8 | Both | Aft of pressure hull |
| VLS (if fitted) | AT-AV area | 688i-VLS only | Between bow and pressure hull. 12 x TASM cells. |
| Bow Array | AX-BA area | Both | Sonar dome, forward of pressure hull |

External equipment can be damaged by weapon hits but has no flooding, fire, or crew mechanics.

---

#### 688i Complete Vessel Summary

| Property | Value |
|----------|-------|
| Watertight Sections | 3 |
| Watertight Doors | 2 |
| Total Watchspaces | 16 (10 in WTS1 + 2 in WTS2 + 4 in WTS3) + battery |
| Total Compartments | ~21 (12 in WTS1 + ~2 in WTS2 + ~7 in WTS3) |
| External Equipment | 2-3 (propshaft, bow array, VLS if variant) |
| Crew | 130 |
| DC Teams | 2 (Alpha forward in WTS1, Bravo aft in WTS3) |

#### 688i Crew Distribution (130 total)

| WTS | Section | Watch A | Watch B | Duty | Total |
|-----|---------|---------|---------|------|-------|
| 1 | Forward Compartment (10 watchspaces) | ~42 | ~42 | ~10 | ~94 |
| 2 | Reactor Compartment (2 watchspaces) | 1 | 1 | 1 | 3 |
| 3 | Engineering (4 watchspaces) | ~14 | ~12 | ~2 | ~28 |
| — | Medical (located in WTS 1) | — | — | 2 | 2 |
| — | Supply (located in WTS 1) | — | — | 3 | 3 |
| | **TOTAL** | **~57** | **~55** | **~18** | **130** |

**Note:** WTS 1 holds ~72% of the crew across 10 watchspaces. A flooding casualty there is immediately life-threatening — it takes out the control room, sonar, torpedo room, and most of the crew in one section.

#### 688i DC Teams

| Team | Designation | Muster Watchspace | Area |
|------|------------|-------------------|------|
| Alpha | Forward DC Party | Crew Mess mid (WTS 1, AF-AM R7-8) | Primary — covers the forward section |
| Bravo | Aft DC Party | Maneuvering (WTS 3, Q-S R5-6) | Secondary — covers engineering |

#### 688i Hull Outline Notes

- Classic US SSN teardrop profile
- Fairwater planes mounted on sail
- Sail positioned above Control Room / Sonar Room area (masts at AJ-AK)
- 7-blade conventional screw
- Cruciform stern planes
- 2 watertight bulkhead dividers visible in outline
- External: bow sonar dome forward, VLS tubes (if variant), propshaft aft

#### 688i Relative Section Proportions (from schematic grid)

| WTS | Grid Columns | Width (cols) | Approximate % |
|-----|-------------|-------------|---------------|
| 1 (Forward) | AB-AQ | 16 | ~55% |
| 2 (Reactor) | V-Y | 4 | ~14% |
| 3 (Engineering) | G-S | 13 | ~31% |

#### Los Angeles Class Variants

| Variant | Key | Full Name | VLS | Magazine | Notes |
|---------|-----|-----------|-----|---------|-------|
| Flight I | `688` | USS Dallas (SSN-700) | None | 26 (4 tubes + 22 rack) | Original LA class |
| Improved (Flight II/III) | `688i` | USS Providence (SSN-719) | 12 x TASM | 26 (4 tubes + 22 rack) | Adds external VLS cells. First 688i with VLS. |

Both variants share the identical internal layout, crew, DC configuration, and schematic. The `688i` adds external VLS launch cells only. The game treats these as two separate selectable submarines.

**Implementation note:** The `688i` key currently exists in `vessels.js` as the sole LA class entry. This will be split into `688` (base, no VLS) and `688i` (improved, with VLS). The current `688i` config has `vlsCells:12` and `vlsWeapon:'tasm'` — these move to the `688i` variant only. The `688` variant gets `vlsCells:0, vlsWeapon:null`.

### 3.5 Gameplay Implications of Realistic WTS Counts

With 3 WTS instead of 6, the gameplay dynamics change significantly:

**Flooding:**
- A single flooded section is far more devastating — WTS 1 contains most of the crew and most critical systems
- With only 3 sections, losing one to flooding means losing ~33-60% of the boat
- Flooding rates may need tuning — current rates calibrated for smaller sections may be too fast for the larger volume of a realistic WTS
- **Flooding tuning is deferred to final stages** as Jason has noted

**Fire:**
- Fire can spread across more rooms before reaching a watertight boundary
- A fire in the forward compartment has many more rooms to propagate through
- Drench system covers a larger area per section

**DC Teams:**
- Shorter transit times within a section (everything is in the same WTS)
- But the sections are physically larger — more distance to cover within a section
- Only 2 WTDs to manage

**Crew casualties:**
- A hit on WTS 1 can wound/kill crew across torpedo room, control room, sonar, comms simultaneously
- Much higher stakes per weapon impact

---

## 4. Watch Roles by Nation

### 4.1 United States Navy (688i, Seawolf)

| Role | Abbreviation | Location | Notes |
|------|-------------|----------|-------|
| Commanding Officer | CO | Control Room | Duty |
| Executive Officer | XO | Control Room | Duty |
| Officer of the Deck | OOD | Control Room | Watch — equivalent of UK OOW |
| Diving Officer | DO | Control Room | Watch — oversees depth/trim |
| Chief of the Watch | COW | Control Room | Watch — ballast/trim panel |
| Fire Control Technician of the Watch | FTOW | Control Room | Watch — TDC operator |
| Sonar Supervisor | SONAR SUP | Sonar Room | Watch |
| Quartermaster of the Watch | QMOW | Control Room | Watch — navigation |
| Helmsman | HELM | Control Room | Watch |
| Planesman | PLANES | Control Room | Watch |
| Throttleman | THROT | Maneuvering | Watch — engine orders |
| Reactor Operator | RO | Maneuvering | Watch |
| Electrical Operator | EO | Maneuvering | Watch |
| Engineering Officer of the Watch | EOOW | Maneuvering | Watch |
| Torpedo Room Supervisor | TRS | Torpedo Room | Watch |
| Radio Room Supervisor | RADIO SUP | Comms | Watch |

### 4.2 Royal Navy (Trafalgar, Swiftsure)

| Role | Abbreviation | Location | Notes |
|------|-------------|----------|-------|
| Commanding Officer | CO | Control Room | Duty |
| Executive Officer | XO | Control Room | Duty |
| First Lieutenant | 1ST LT | Control Room | Duty — DC coordinator |
| Officer of the Watch | OOW | Control Room | Watch |
| Coxswain | COX'N | Control Room | Duty — senior rating |
| Sonar Controller | SON CTL | Sound Room | Watch |
| Planesman | PLNSMN | Control Room | Watch |
| Helmsman | HELSMN | Control Room | Watch |
| TDC Operator | TDC OP | Control Room | Watch |
| Navigation Plotter | NAV PLT | Control Room | Watch |
| Manoeuvring Room Watch Officer | MRWO | Maneuvering | Watch |
| Chief of the Watch (Torpedo) | COW(T) | Torpedo Room | Duty |
| Radio Operator | RADIO | Control Room | Watch |

### 4.3 Deutsche Marine (Type 209)

| Role | Abbreviation | Location | Notes |
|------|-------------|----------|-------|
| Kommandant | KDT | Control Room | Duty — CO equivalent |
| Erster Wachoffizier | IWO | Control Room | Duty — XO equivalent |
| Wachoffizier | WO | Control Room | Watch — OOD equivalent |
| Leitender Ingenieur | LI | Engine Comp | Duty — Chief Engineer |
| Obersteuermann | OSTM | Control Room | Watch — Navigator/Helmsman |
| Zentralemaat | ZM | Control Room | Watch — Control Room senior rate |
| Sonarmeister | SONM | Control Room | Watch — Sonar operator |
| Torpedomeister | TORM | Torpedo Room | Watch — Torpedo supervisor |
| Maschinenmaat | MASM | Engine Comp | Watch — Engine watchkeeper |
| Elektromaat | EMAT | Motor Room | Watch — Electrical watchkeeper |
| Funker | FUNK | Control Room | Watch — Radio operator |
| Sanitätsmaat | SANM | Accommodation | Duty — Medic |

**Language note:** Crew will have German names. Role abbreviations use German terminology. All in-game text (comms log, DC reports) remains in English with German abbreviations displayed.

---

## 5. Magazine & Tube Mechanics

### 5.1 Current System

Weapons are tracked as a single count (`torpStock`). Tubes reload from a shared pool. Any weapon type can be loaded at any time. No pre-mission loadout selection.

### 5.2 Proposed System

**Tube state tracking:**
Each torpedo tube is tracked individually:
- `empty` — tube is empty, can accept any weapon type
- `loaded:[weapon_type]` — tube contains a specific weapon, ready to fire
- `loading:[weapon_type]` — tube is being loaded (reload timer active)

**Magazine rack tracking:**
The magazine rack has a fixed capacity. Each slot holds one weapon of a specific type.
- Rack slots are consumed when weapons are stowed
- Rack slots are freed when weapons are loaded into tubes

**Tube swap restriction:**
A weapon can only be unloaded from a tube if there is a free rack slot to receive it. If the rack is full (all slots occupied), loaded tubes cannot be swapped — the weapon must be fired to free the tube.

This creates a tactical constraint: **if all tubes are loaded and the rack is full, you are committed to your current loadout until you fire something.**

### 5.3 Pre-Mission Loadout Screen

A new screen added after vessel selection and before scenario start. The player decides:

1. **Rack contents:** How many of each valid weapon type to carry in the magazine rack. Total must equal rack capacity.
2. **Tube pre-loads:** Which weapon to load into each tube at scenario start. All tubes start loaded (wartime SOP).

**Valid weapon types per vessel:**

| Class | Torpedo | Missile | Notes |
|-------|---------|---------|-------|
| 688i | MK-48 ADCAP | Harpoon | Rack holds mix of both |
| 688i-VLS | MK-48 ADCAP | Harpoon | Same rack. VLS holds TASM separately. |
| Trafalgar | Spearfish | Sub-Harpoon | |
| Swiftsure | Tigerfish Mk 24 | Sub-Harpoon | |
| Seawolf | MK-48 ADCAP | Harpoon | |
| Type 209 | SST-4 / SUT | SM39 Exocet | |

**Default loadout** (if player skips selection): All tubes loaded with torpedoes. Rack filled with torpedoes except for the vessel's default missile allocation.

### 5.4 Realistic Magazine Capacities

| Class | Tubes | Rack Slots | Total Capacity | Current (wrong) | Notes |
|-------|-------|------------|----------------|-----------------|-------|
| 688i Dallas | 4 | 22 | **26** | 32 | Corrected |
| Trafalgar | 5 | 20 | **25** | 25 | Correct |
| Swiftsure | 5 | 15 | **20** | 20 | Correct |
| Seawolf | 8 | 42 | **50** | 50 | Correct |
| Type 209 | 8 | 6 | **14** | 14 | Correct |

**688i correction needed:** `torpStock` should be 26, not 32.

### 5.5 Weapon Swap Flow

```
PLAYER wants to load a Harpoon into Tube 1 (currently loaded with MK-48):

1. Is there a free rack slot?
   YES -> Unload MK-48 from Tube 1 -> stow in rack -> load Harpoon from rack -> done
   NO  -> "CANNOT SWAP — MAGAZINE FULL" — must fire Tube 1 first to free the slot
```

### 5.6 VLS Independence

VLS cells (688i-VLS variant: 12 x TASM) are external to the pressure hull and completely separate from the torpedo tube magazine system. VLS weapons:
- Cannot be swapped with tube weapons
- Cannot be reloaded at sea
- Are fire-and-forget (no wire guidance)
- Are damaged by external hull damage, not internal compartment state

---

## 6. DC Panel Outlines

Each vessel gets a unique hull silhouette drawn in the DC panel. The outline replaces the current generic pill shape.

### 6.1 Two-Zone Rendering

The DC panel outline renders two distinct zones:

**Pressure hull (interior):** Drawn as the main hull outline with watertight bulkhead dividers. Compartments within each WTS are shown. Flooding, fire, crew status, and system state are displayed here.

**External equipment:** Drawn outside the hull boundary. Bow array, VLS (if fitted), propshaft/propulsor shown as separate elements. Damage state indicated but no flooding/fire/crew mechanics.

### 6.2 Visual Distinguishing Features

| Class | Sail Position | Planes | Propulsor | Stern | WTS Count | Distinctive |
|-------|-------------|--------|-----------|-------|-----------|-------------|
| 688i | Mid-forward | Fairwater (on sail) | 7-blade screw | Cruciform | 3 | Classic US SSN profile |
| Trafalgar | Mid-forward | Hull-mounted (forward) | Pump-jet (shrouded) | Cruciform | TBD | No visible blades aft |
| Swiftsure | Mid-forward | Hull-mounted (forward) | Conventional screw | Cruciform | TBD | Shorter sail than Trafalgar |
| Seawolf | Mid-forward | Sail-mounted retractable | Conventional screw | Cruciform | TBD | Wider hull, larger overall |
| Type 209 | Forward-mid | Sail-mounted | Conventional screw | Cruciform | TBD | Much smaller, compact shape |

### 6.3 Additional Outline Indicators

Vessel-specific status indicators rendered on or near the outline:
- **Type 209:** Battery gauge bar below hull, snorkel mast indicator
- **Nuclear boats:** Reactor status icon in reactor WTS
- **All boats:** HPA pressure gauge (sized to vessel)
- **All boats:** Trim indicator arrows (fore/aft ballast)

### 6.4 Implementation Approach

Each outline is a dedicated draw function in `src/render/outlines/outline-[key].js`. The function receives canvas context, bounding box, and vessel state, and draws the hull silhouette with watertight bulkhead dividers aligned to the section widths.

The current `pillPath()` and `outerPillPath()` in `render-dc.js` are replaced by a dispatch to the vessel-specific outline function.

---

## 7. Nation-Specific Communications

### 7.1 Terminology Differences

| Event | US Navy | Royal Navy | Deutsche Marine |
|-------|---------|------------|-----------------|
| Torpedo launch | "TORPEDO AWAY" | "TORPEDO GONE" | "TORPEDO LOS" |
| Emergency blow | "EMERGENCY BLOW" | "BLOW ALL MAIN BALLAST" | "NOTANBLASEN" |
| Watch relief | "RELIEVING THE WATCH" | "RELIEVE THE WATCH" | "WACHABLÖSUNG" |
| Fire report | "FIRE FIRE FIRE" | "FIRE FIRE FIRE" | "FEUER FEUER FEUER" |
| Flooding report | "FLOODING IN [section]" | "FLOOD FLOOD FLOOD, [section]" | "WASSEREINBRUCH" |
| Torpedo incoming | "TORPEDO IN THE WATER" | "TORPEDO TORPEDO TORPEDO" | "TORPEDO ALARM" |
| Contact report | "NEW CONTACT, SIERRA [N]" | "NEW CONTACT, SERIAL [N]" | "NEUER KONTAKT" |
| Speed order | "ALL AHEAD [speed]" | "HALF AHEAD / FULL AHEAD" | "HALBE FAHRT / VOLLE FAHRT" |

**Implementation:** The comms/voice template system selects nation-appropriate templates based on the active vessel's `nation` field.

### 7.2 In-Game Display

All display text remains in English. German terms appear only in:
- Crew role abbreviations (KDT, WO, LI, etc.)
- Crew names (German first/last names)
- Command announcements in the message log (with English in brackets on first use)

Example: `KDT Weber: "TORPEDO LOS" [torpedo away]`

---

## 8. Implementation Architecture

### 8.1 New Files

```
src/config/vessel-layouts/
  ├── index.js              # getLayout(vesselKey) dispatcher — IMPLEMENTED
  ├── layout-688.js         # 688/688i 3-WTS layout — IMPLEMENTED
  ├── layout-legacy.js      # 6-WTS compatibility shim — IMPLEMENTED
  ├── layout-trafalgar.js   # awaiting schematic
  ├── layout-swiftsure.js   # awaiting schematic
  ├── layout-seawolf.js     # awaiting schematic
  └── layout-type209.js     # awaiting schematic

src/render/outlines/
  ├── index.js              # drawOutline(vesselKey, ctx, bounds) dispatcher — IMPLEMENTED
  ├── outline-688.js        # 688/688i hull outline — IMPLEMENTED
  ├── outline-trafalgar.js  # awaiting schematic
  ├── outline-swiftsure.js  # awaiting schematic
  ├── outline-seawolf.js    # awaiting schematic
  └── outline-type209.js    # awaiting schematic
```

### 8.2 Modified Files

| File | Change |
|------|--------|
| `config/vessels.js` | Add `magazineRack`, correct `torpStock` for 688i (26), add `688i_vls` variant |
| `systems/damage/damage-data.js` | Becomes thin wrapper — reads from active vessel layout instead of hardcoded data |
| `systems/damage/crew-roster.js` | `CREW_MANIFEST` becomes vessel-keyed — each vessel has its own manifest |
| `systems/damage/dc-teams.js` | Team size/composition varies per vessel |
| `systems/damage/index.js` | `initDamage()` reads vessel layout for compartment count |
| `systems/damage/flooding.js` | Must handle variable compartment count. Flooding rates may need per-vessel tuning. |
| `systems/damage/fires.js` | Must handle variable compartment count |
| `systems/weapons.js` | Add tube state tracking, rack slot tracking, swap restriction logic |
| `render/panels/render-dc.js` | Replace generic pill with vessel-specific outline dispatch. Handle variable WTS count. |
| `render/panels/render-crew.js` | Handle variable crew size and section count |
| `render/panels/render-start.js` | Add pre-mission loadout screen after vessel selection |
| `narrative/comms.js` | Nation-keyed voice templates |
| `state/sim-state.js` | Tube state array, rack state, external equipment state |

### 8.3 Implementation Patterns (critical for new vessel work)

These patterns were established during Phase 1 and MUST be followed for all new vessels:

**1. Layout file structure** — Copy `layout-688.js` as a template. Each layout exports: `COMPS`, `COMP_DEF`, `SECTION_LABEL`, `SECTION_SHORT`, `COMP_FRACS`, `COMP_LABELS`, `WTD_PAIRS`, `WTD_RC_KEYS`, `TRAVEL`, `EVAC_TO`, `SECTION_CAP`, `ROOMS`, `SYS_DEF`, `EXTERNALS`, `HIGH_ENERGY_SYS`, `PASSIVE_SYS`, `TRIM_LEVERS`.

**2. Rooms must have `col` and `colSpan`** — These define horizontal position within the WTS for spatial adjacency (D010). Without them, fire spread falls back to deck-only adjacency which is wrong for large sections.

**3. WTD systems** — Each watertight door needs a system entry in `SYS_DEF` with `isWTD: true` and `wtdKey: 'sectionA|sectionB'`. These are damageable/repairable and control door operability.

**4. Register layout in dispatchers** — Add the new vessel key to:
  - `vessel-layouts/index.js` → `LAYOUTS` map
  - `render/outlines/index.js` → `OUTLINES` map (if custom outline)
  - `render/panels/render-start.js` → `shapes` object (vessel silhouette on selection screen)

**5. COMP_LAYOUT in render-damage-screen.js** — Each vessel needs a room grid entry mapping rooms to visual positions (`c`, `cs`, `d`, `ds`, `lbl`, `cap`, `rid`). This controls how rooms render inside the hull schematic. Column 0 = bow/left, highest column = aft/right.

**6. DMG export uses getters** — The `DMG` object in `damage/index.js` uses JavaScript getters for all vessel-specific properties. This is critical — direct property assignment captures stale values. All vessel-specific data must use `get PROP(){ return PROP; }` pattern.

**7. Crew manifest mapping** — Until each vessel has its own crew manifest, `crew-roster.js` uses `_LEGACY_MAP` to map legacy compartment keys to the new layout's keys. New vessels with non-legacy keys need entries in this map OR their own crew manifest.

**8. Compartment key compatibility in damage logic** — `damage/index.js` has OR-checks for legacy and new compartment keys (e.g. `comp==='reactor_comp'||comp==='reactor'`). New vessels with novel section names may need additional entries.

### 8.4 Key Design Constraints

1. **The `COMPS` array must not be hardcoded to any fixed length.** All code that iterates over compartments must use the vessel's compartment list. Every `for(let ci=0;ci<6;ci++)` must become `for(let ci=0;ci<COMPS.length;ci++)`.

2. **External equipment is NOT part of COMPS.** External systems (bow array, VLS, propshaft) are tracked in a separate `EXTERNALS` structure. They have damage states but no flooding, fire, or crew mechanics.

3. **Flooding rates will need per-vessel tuning** in the final stages. Larger WTS sections contain more volume — current rates calibrated for 6 small sections may be too aggressive for 3 large sections.

---

## 9. Implementation Phases

### Phase 1 — LA Class Schematic Implementation (test case)
- Create `vessel-layouts/` module structure with 688i layout from schematic
- Implement 3 WTS layout: forward compartment, reactor, engineering
- Implement external equipment tracking (bow array, propshaft)
- Make `damage-data.js` read from vessel layout instead of hardcoded data
- Make all compartment iteration use `COMPS.length` not `6`
- Implement 688i DC panel outline (replacing generic pill)
- Wire up 688i crew manifest (130 crew with USN roles)
- **Non-688i vessels temporarily use legacy 6-WTS layout via compatibility shim**
- **Sign-off:** 688i plays with correct 3-WTS layout and unique DC panel outline. Other vessels still functional.

**Phase 1 additionally delivered (not originally scoped — driven by 3-WTS playtesting):**
- Torpedo hit damage localised to impact room + adjacent rooms (D011)
- Fire heat damage changed to accumulator-based (guaranteed, not probabilistic)
- Fire heat radiates to adjacent rooms when source room has no systems
- Room adjacency uses col/colSpan spatial proximity (D010)
- Fire growth rate increased, spread threshold lowered, spread chance tripled
- DC suppression tuned to stall at 80%
- effectiveState checks per-room not per-section (fire/flood/drench)
- WTDs added as damageable/repairable systems (D012)
- Bulkhead burn-through mechanic (60s sustained 100% fire)
- Undetected fires hidden from DC panel until watchkeeper confirms
- False fire alarm system for unmanned rooms
- Systems rendered inside watchspace room blocks (old grid removed)
- Clickable watchspace detail panel with status, crew, systems, DC dispatch buttons
- Section-wide worst-state colour overlay removed
- Dev panel rewired to dynamic layout data
- Dev panel clicks no longer bleed through to canvas

### Phase 2 — Magazine Rack & Swap Restriction

**What already exists (no changes needed):**
- Per-tube state tracking (`torpTubes[]` — 0=ready, -1=wire, >0=reload timer)
- Per-tube load type (`tubeLoad[]` — `'torp'`, missile key, or `null`=empty)
- `orderLoad(tube, weaponKey)` — load empty tube, deducts stock
- `orderUnload(tube)` — unload tube, returns weapon to stock
- `orderStrikeReload(tube, weaponKey)` — swap loaded weapon (2.15x time)
- One tube operation at a time (`tubeOp` gate)
- Tubes start loaded with torpedoes
- 688 `torpStock` corrected to 26 ✅ (Phase 1)
- 688/688i vessel split ✅ (Phase 1)

**What changes:**
1. **`magazineRack` property in vessels.js** — defines rack capacity (separate from tube count). Total weapon capacity = tubes + rack. Values: 688=22, Trafalgar=20, Swiftsure=15, Seawolf=42, Type 209=6.
2. **`torpStock` initialisation** — currently set to total capacity including tubes. Must be `magazineRack` (rack only) since tubes are already loaded and tracked separately via `tubeLoad`.
3. **Swap restriction in `_orderStrikeReload`** — before swapping, check if rack has a free slot to receive the outgoing weapon. If `torpStock + missileStock >= magazineRack`, block the swap: "MAGAZINE FULL — CANNOT SWAP".
4. **Unload restriction in `_orderUnload`** — same check: if rack is full, weapon has nowhere to go. Block: "MAGAZINE FULL — CANNOT UNLOAD".
5. **Load from rack decrements correctly** — `_orderLoad` already decrements stock. No change needed.
6. **Unload to rack increments correctly** — completion handler already increments stock. No change needed, but must not exceed rack capacity.

**Files modified:**
- `config/vessels.js` — add `magazineRack` to each vessel
- `sim/index.js` — fix `torpStock` init in `reset()` to use rack capacity
- `sim/player-control.js` — add rack-full checks to `_orderStrikeReload` and `_orderUnload`

**Sign-off:** Strike reload blocked when rack is full. Unload blocked when rack is full. torpStock initialised to rack contents (not total). All vessels fire and reload correctly.

### Phase 3 — Pre-Mission Loadout Screen
- Add loadout screen after vessel selection
- Player chooses rack contents (weapon type mix)
- Player chooses tube pre-loads
- Default loadout if skipped
- **Sign-off:** Loadout selection works, scenario starts with chosen configuration

### Phase 4 — Remaining Vessel Layouts (one at a time)
- Implement each vessel's layout as Jason provides schematics
- Each layout includes: WTS structure, rooms, systems, crew manifest, travel times, external equipment
- Unique DC panel outline per vessel
- Test each vessel individually before moving to the next
- **Sign-off:** Each vessel plays with its own layout and outline

### Phase 5 — Nation-Specific Communications
- Add nation-keyed voice templates
- German crew names for Type 209
- USN terminology for US boats, RN for UK boats
- Command terminology varies by nation
- **Sign-off:** Message log uses correct terminology for each vessel

### Phase 6 — Additional Differentiators
- Propulsion character differences (throttle response, acceleration curves)
- Emergency procedure differences (blow terminology, escape systems)
- Atmospheric system differences (O2 candles vs electrolysis for Type 209)
- **Sign-off:** Full playthrough of each vessel feels distinct

### Phase 7 — Flooding & Balance Tuning
- Tune flooding rates per vessel / per WTS volume
- Balance DC team effectiveness for different section sizes
- Tune fire spread rates for larger compartments
- Crew casualty rates adjusted for section crew density
- **Sign-off:** Damage feels realistic and balanced across all vessel classes

---

## 10. Sign-off Process

Each phase follows the established process:
1. Claude implements the phase
2. Claude updates `MIGRATION.md` and `DECISIONS.md`
3. Jason playtests
4. Jason signs off or raises issues
5. Next phase begins only after sign-off

Layout specifications (Phase 4) have an additional step:
1. Jason provides schematic image for a vessel
2. Claude translates to room grid / systems / crew format
3. Jason reviews and confirms the translation
4. Claude implements
5. Jason playtests that specific vessel
6. Repeat for next vessel

---

## 11. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Type 209: 1 or 2 DC teams? | ✅ Keep 2 DC teams (confirmed by Jason 2026-03-21) |
| 2 | Type 209: how many WTS? (awaiting schematic) | ✅ 3 WTS — implemented in Phase 4 |
| 3 | Seawolf: how many WTS? (awaiting schematic) | ✅ 3 WTS — implemented in Phase 4 |
| 4 | Trafalgar: how many WTS? (awaiting schematic) | ✅ 3 WTS — implemented in Phase 4 |
| 5 | Swiftsure: how many WTS? (awaiting schematic) | ✅ 3 WTS (shares Trafalgar layout) — implemented in Phase 4 |
| 6 | 688/688i layout review: confirm Section 3.5 matches intent | ✅ Confirmed by Jason |
| 7 | 688 vs 688i: any differences beyond external VLS cells? | ✅ No — identical internals. 688 = Flight I (no VLS), 688i = Improved (VLS) |
| 8 | Pre-mission loadout: replaces current scenario start or additional step after vessel selection? | ✅ Additional step after vessel selection — works fine (confirmed by Jason 2026-03-21) |
| 9 | Flooding rate tuning approach: per-vessel multiplier or per-WTS volume calculation? | ⬜ Deferred to Phase 7 |
