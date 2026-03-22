# Steady Bubble — Claude Briefing

## What This Project Is

**Steady Bubble** is a browser-based submarine warfare simulation game built on HTML5 Canvas with vanilla JavaScript. It is a structural migration of **subgame2** (Doodle Sub: Captain Sim v5), located at:

```
../subgame2/
```

V1 (subgame2) is the behavioral ground truth. V2 (Steady Bubble) must be functionally identical to V1 when migration is complete. No new features are in scope during migration.

---

## Team Structure

| Role | Who |
|---|---|
| Project Manager / Creative Director | Jason (the user) |
| Dev Team | Claude (you) |

**This boundary is strict.**

- Jason does not touch code.
- Claude does not make creative or feature decisions.
- If Claude encounters a decision that affects gameplay, feel, or scope — stop and ask.
- If Claude encounters a structural/technical decision — make it, log it in `docs/DECISIONS.md`, continue.

---

## Your Standing Instructions

1. **Read the active project's `SESSION-LOG.md` at the start of every session** before doing anything. It tells you what has been done and what's next. Currently: `docs/realism-overhaul/SESSION-LOG.md`.
2. **Read the active project's `DESIGN.md` for the design** — implementation patterns, phase structure, open questions. Currently: `docs/realism-overhaul/DESIGN.md`.
3. **Update the active project's `SESSION-LOG.md` at the end of every session.** Record what was done, problems encountered, and how they were solved. This is non-negotiable — it is how continuity is maintained across your memory loss between sessions.
4. **Log decisions in the active project's `DECISIONS.md`.** Any technical decision that could be argued either way, or that future-you might question, gets recorded there with rationale.
5. **Do not start a phase until the previous phase is confirmed working by Jason.** Playtesting and sign-off between phases is Jason's responsibility.
6. **Do not modify subgame2 (V1).** It is the reference, not the working copy.
7. **Read `manual.md` (the constitution)** when working on gameplay mechanics. It is the authoritative reference for all game systems.

---

## What V2 Is and Is Not

**V2 IS:**
- The same game, same mechanics, same feel, same content
- Restructured into ES6 modules with Vite as the bundler
- Split into logical, maintainable files (no file over ~800 lines)
- Properly separated state (sim state vs UI state vs session state)
- Structured to support future development in: realism, simulation depth, smarter AI

**V2 IS NOT:**
- A feature update
- A visual redesign
- A gameplay change of any kind
- An opportunity to "improve" things that aren't structural

---

## Technology Stack

- **Bundler:** Vite (zero-config, no framework)
- **Language:** Vanilla JavaScript, ES6 modules (`import`/`export`)
- **Rendering:** HTML5 Canvas 2D context (unchanged from V1)
- **Runtime:** Browser only, no Node.js at runtime
- **Testing:** Manual playtesting by Jason (no automated test suite)

---

## Key Paths

| Thing | Path |
|---|---|
| Project root | `steadybubble/` |
| V1 reference | `super-gill.github.io/my-projects/subgame2/` (DO NOT MODIFY) |
| Source | `steadybubble/src/` |
| Constitution | `steadybubble/manual.md` |
| **Active project docs** | `steadybubble/docs/realism-overhaul/` |
| — Design doc | `docs/realism-overhaul/DESIGN.md` |
| — Session log | `docs/realism-overhaul/SESSION-LOG.md` |
| — Decisions | `docs/realism-overhaul/DECISIONS.md` |
| **Completed project** | `steadybubble/docs/vessel-individuality/` |
| — Design doc | `docs/vessel-individuality/DESIGN.md` |
| — Session log | `docs/vessel-individuality/SESSION-LOG.md` |
| — Decisions (D008-D019) | `docs/vessel-individuality/DECISIONS.md` |
| **Planned project** | `steadybubble/docs/mission-system/` |
| — Design doc | `docs/mission-system/DESIGN.md` |
| **Planned project** | `steadybubble/docs/weapons-expansion/` |
| — Design doc | `docs/weapons-expansion/DESIGN.md` |
| **Archived project** | `steadybubble/docs/migration/` |
| — Migration status | `docs/migration/MIGRATION.md` (COMPLETE) |
| — Decisions (D001-D007) | `docs/migration/DECISIONS.md` |
| — Architecture | `docs/migration/ARCHITECTURE.md` |
| Global docs | `steadybubble/docs/BUGS.md`, `docs/FEATURE-REQUESTS.md` |
