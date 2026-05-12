# ACCENT LIGHTING — MASTER PROJECT REFERENCE
> **Version:** 2.1 | **Last updated:** 2026-05-12
> **Maintainer:** Michael Graf | **Scope:** AccentOS + Ecommerce + Website + All Ops  
> **Location:** `github.com/mgraf77/accent-os/MASTER.md` (source of truth)  
> **Rule:** This file is updated at the end of every working session. It replaces Notion, stale PDFs, and scattered docs.

---

## TABLE OF CONTENTS

1. [Company Overview](#1-company-overview)
2. [Operating Model — How We Work](#2-operating-model--how-we-work)
3. [AccentOS — Current State](#3-accentos--current-state)
4. [AccentOS — Architecture](#4-accentos--architecture)
5. [AccentOS — Full Build Plan](#5-accentos--full-build-plan)
6. [AccentOS — Database Schema](#6-accentos--database-schema)
7. [Website Redesign](#7-website-redesign)
8. [Ecommerce & Google Ecosystem](#8-ecommerce--google-ecosystem)
9. [Vendor Ranking & Rep Strategy](#9-vendor-ranking--rep-strategy)
10. [All Accounts & Credentials Map](#10-all-accounts--credentials-map)
11. [Tech Stack & Integrations](#11-tech-stack--integrations)
12. [Hard Rules & Constraints](#12-hard-rules--constraints)
13. [Open Loops & Blockers](#13-open-loops--blockers)
14. [Long-Term Vision](#14-long-term-vision)
15. [Session Log](#15-session-log)

---

## 1. COMPANY OVERVIEW

**Accent Lighting Inc.**  
10322 E. Stonegate Ln., Suite 100, Wichita, KS 67206  
(316) 636-1278 | Mon–Fri 8:00am–5:30pm, Sat 10:00am–3:00pm  
Founded: 1979 | Brick-and-mortar lighting showroom + ecommerce

**Ownership:** Paul Graf & Patrick Graf  
**Director of BI & Operations:** Michael Graf

**Business contact email:** lamessages@accentlightinginc.com  
**Michael's work email:** michaelg@accentlightinginc.com

**Core business:** Commercial and residential lighting sales — showroom (primary) + online. 475+ vendor relationships. Wichita market.

---

## 3. ACCENTOS — CURRENT STATE

### Version
**v6.10.75** (as of 2026-05-12)

### What's Live
The application is a modular SPA. Core features (Vendor Ranking, Quotes) remain in `index.html`, while newer features are modularized in `js/`.

---

## 4. ACCENTOS — ARCHITECTURE

### Repo Structure
```
accent-os/
├── index.html              # Shell: nav, routing, shared utilities, auth, core logic
├── js/                     # Specialized feature logic extracted from index.html
│   ├── customers.js        # CRM · RFM · Lifecycle
│   ├── internal_meetings.js # Meeting sync and agenda management
│   ├── ...                 # Other modularized features
├── sql/                    # Supabase schema migrations
├── worker/                 # Cloudflare Workers (Anthropic proxy)
├── skills/                 # Agentic skill definitions
├── MASTER.md               # THIS FILE
├── SESSION_LOG.md          # Append-only session log
└── BUILD_PLAN_CLAUDE.md    # Active execution queue
```

### File Split Architecture
- **index.html** = shell + nav + shared utilities + auth + core modules.
- Feature logic is modularized into files within the `js/` directory.
- Module files are loaded after the main inline script to ensure all globals are defined.

---

*End of MASTER.md — Update at end of every session.*
