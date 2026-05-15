# Documentation Truth Map - AccentOS

This document resolves overlapping or potentially conflicting information across repo markdown files.

| Topic | Primary Truth | Overlaps With | Resolution |
|---|---|---|---|
| **Module Status** | `module_modes.json` | `MASTER.md` (§3) | `module_modes.json` is the runtime configuration; `MASTER.md` is for human-readable high-level status. |
| **KPI Definitions** | `KPI_CATALOG.md` | `index.html` (SEED_KPIS) | `KPI_CATALOG.md` is the research source; `index.html` contains the subset of currently implemented KPIs. |
| **Architecture** | `docs/architecture/` | `MASTER.md` (§4) | `MASTER.md` provides the "what"; `docs/architecture/` provides the "how" (flow, dependencies). |
| **Session History**| `SESSION_LOG.md` | `BUILD_INTELLIGENCE.md` | `SESSION_LOG.md` is chronological; `BUILD_INTELLIGENCE.md` is categorical (lessons learned). |
