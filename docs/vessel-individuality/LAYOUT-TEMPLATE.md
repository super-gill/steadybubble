# Vessel Layout Communication Template

Use this template to define the internal layout of each submarine class. Fill in one template per vessel. Claude will implement the layout exactly as specified here.

---

## How to Use This Template

Each submarine is divided into **Watertight Sections (WTS)**. Each WTS contains **rooms** arranged across **decks** (upper, mid, lower). Some sections may only have 2 decks.

For each vessel, you provide:
1. **Section breakdown** — what the WTS divisions are and what they're called
2. **Room grid** — what rooms exist on each deck within each section
3. **Systems placement** — which shipboard systems live in which rooms
4. **Crew allocation** — how many crew per section, split by watch

Use real reference images or cutaway diagrams as your source. The template below captures what Claude needs to build each layout in code.

---

## Template: [CLASS NAME]

### Section Breakdown

| WTS | Name | Label (DC Panel) | Notes |
|-----|------|-------------------|-------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | *(delete this row if vessel has fewer sections)* |

### Room Grid — WTS [N]: [Name]

*Repeat this table for each WTS. Rooms on the same row share a deck level. Rooms on the same column are vertically adjacent.*

| Deck | Room A | Room B | Room C |
|------|--------|--------|--------|
| Upper (D0) | *room name* | *room name or — if empty* | |
| Mid (D1) | *room name* | *room name* | |
| Lower (D2) | *room name* | *room name* | |

For each room, note:
- **Manned?** Yes (crew on watch) or No (unmanned — fire detection delayed)
- **Crew on watch:** number of watchkeepers stationed here during normal ops
- **Detection delay:** if unmanned, how long before fire is noticed (30-60s typical)

### Systems Placement

| System | Room Location | Notes |
|--------|--------------|-------|
| Torpedo tubes | WTS1 / Torpedo Room (D2) | |
| Sonar array | WTS1 / Forward Dome (D0) | |
| Fire control | WTS2 / Control Room (D1) | |
| Helm | WTS2 / Control Room (D1) | |
| *(etc — list all major systems)* | | |

### Crew Allocation

| WTS | Section Name | Watch A | Watch B | Duty | Total |
|-----|-------------|---------|---------|------|-------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |
| — | Medical | — | — | | |
| — | Supply | — | — | | |
| | **TOTAL** | | | | **[crew size]** |

### Watch Roles

*List the key watchkeeper positions for this vessel class. Use nation-appropriate terminology.*

| Role | Abbreviation | Watch | Location | Notes |
|------|-------------|-------|----------|-------|
| | | A/B/duty | WTS [N] | |

### DC Teams

| Team | Designation | Muster Location | Members (Watch A) |
|------|------------|-----------------|-------------------|
| Alpha | Forward DC Party | | *list key roles* |
| Bravo | Aft DC Party | | *list key roles* |

### Hull Outline Notes

*Describe any distinctive visual features for the DC panel silhouette:*
- Sail/fin shape and position:
- Fairwater planes / hull-mounted planes:
- Propulsor type (screw / pump-jet):
- Stern plane configuration:
- Any other distinctive features:

### Relative Proportions

*How wide is each WTS relative to the total hull length? This controls the DC panel compartment widths.*

| WTS | Approximate % of hull length |
|-----|------------------------------|
| 1 | |
| 2 | |
| 3 | |
| 4 | |
| 5 | |
| 6 | |

---

## Example: Current Generic Layout (for reference)

### Section Breakdown

| WTS | Name | Label (DC Panel) | Notes |
|-----|------|-------------------|-------|
| 1 | Fore Ends | TORPEDO ROOM | Sonar, TMA, torpedo tubes, forward planes |
| 2 | Control Room | CONTROL ROOM | Helm, fire control, ballast, navigation |
| 3 | Aux Section | MESS DECKS | CO2 scrubbers, O2 generator, sickbay, messes |
| 4 | Reactor Comp | REACTOR COMP | Reactor, primary coolant, pressuriser |
| 5 | Engine Room | MANEUVERING | Propulsion, turbines, electrical distribution |
| 6 | Aft Ends | ENGINEERING | Towed array, steering, aft planes, shaft seals |

### Room Grid — WTS 1: Fore Ends

| Deck | Room A | Room B |
|------|--------|--------|
| Upper (D0) | FWD DOME (unmanned, 40s delay) | COMMS (3 crew) |
| Mid (D1) | ENG OFFICE (1 crew, 20s delay) | COMPUTER RM (unmanned, 35s delay) |
| Lower (D2) | TORPEDO ROOM (4 crew) | — |

### Crew Allocation (current generic — 90 crew)

| WTS | Section Name | Watch A | Watch B | Duty | Total |
|-----|-------------|---------|---------|------|-------|
| 1 | Fore Ends | 10 | 10 | 1 | 23* |
| 2 | Control Room | 8 | 8 | 4 | 20 |
| 3 | Aux Section | — | — | — | 7** |
| 4 | Reactor Comp | 1 | 1 | 1 | 3 |
| 5 | Engine Room | 11 | 9 | — | 20 |
| 6 | Aft Ends | 8 | 7 | — | 15 |
| — | Medical | — | — | 2 | 2 |
| — | Supply | — | — | 5 | 5 |
| | **TOTAL** | **38** | **35** | **13** | **90** |

*\*includes 2 COMMS per watch + 1 TORPS CPO duty*
*\*\*mess/galley crew from supply dept stationed here*

---

## Notes for Jason

- You don't need to fill in every single room name — give me the major ones and I'll fill gaps with realistic choices.
- If you're working from a cutaway diagram, you can describe it in plain English and I'll map it to the grid format.
- The room grid doesn't need to be perfectly to scale — it's about which rooms exist and where they sit relative to each other.
- For crew numbers: give me the totals per section and I'll distribute across rooms. Or if you have specific positions mapped, include those.
- Systems placement can be high-level ("sonar is in WTS 1") — I know the standard locations for most equipment.
- If a vessel has fewer than 6 WTS (e.g. Type 209 with 5), just delete the extra row.
