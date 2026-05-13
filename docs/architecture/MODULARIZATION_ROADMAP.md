# Modularization Roadmap - AccentOS

This document combines extraction candidates and sequencing into a single authoritative roadmap.

## 1. Low-Risk Candidates (The Foundation)
- **Utility Helpers:** Consolidate `fmt$`, `fmtS`, `esc` into `js/utils.js`.
- **Supabase API:** Isolate `sbFetch` and config into `js/supabase_api.js`.

## 2. Feature Extractions (The Middle)
- **Knowledge Engine:** Isolate AI chat logic.
- **Quotes Engine:** Extract editor and persistence.

## 3. The Monolith Decomposition (The Big Move)
- **Vendor Ranking:** Move 2,000+ lines of logic and `VD_RAW` to `js/vendors.js`.

## 4. Shell Decoupling (Final Stage)
- **Module Registry:** Implement declarative navigation and hydration.
- **Global Encapsulation:** Wrap state in Get/Set APIs.
