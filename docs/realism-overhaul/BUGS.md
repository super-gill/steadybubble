# Realism Overhaul — Bug Tracker

Project-specific bugs introduced or discovered during the realism overhaul. Separate from the global `docs/BUGS.md` which tracks pre-existing issues.

Format: `B-RO-NNN` — severity (CRIT/HIGH/MED/LOW) — status (OPEN/FIXED/WONTFIX) — description

---

| ID | Sev | Status | Description |
|----|-----|--------|-------------|
| B-RO-001 | LOW | OPEN | Tube auto-reload: tubes automatically reload with a torpedo after firing. Should stay empty until player orders a reload. Pre-existing behaviour, not introduced by realism overhaul. |
| B-RO-002 | MED | OPEN | Passive range estimation unreliable: cross-bearing triangulation needs large baseline (500m+) and good crossing angle. At realistic speeds takes several minutes to produce a value, and results are often inaccurate. Bearing-rate range method removed (D-RO-016). Needs dedicated rework as separate project. |
