# AccentOS — Next Steps
> Last updated: 2026-05-08 (post-stabilization pause)

---

## Immediate (Michael-action required)

1. **Redeploy Cloudflare Worker** — run `wrangler deploy` from local terminal at `C:\Users\Michael\Desktop\accent-os`. Unblocks all AI features.
2. **Run M02 schema** — paste `sql/M02_core_schema.sql` into Supabase SQL editor. Unblocks data persistence for Tracks 1–4.
3. **Run M22–M40 schemas** — sequentially, to activate Phase 3 module persistence.

---

## After governance restructuring

The following are recommended starting points once the repo governance structure is settled:

### High priority
- **6.10** — AccentOS → accentlightinginc.com embed (employee tools public-site gated). No blockers, just scope decision.
- **6.11** — Windward ERP live integration (read-only via S5WebAPI Edge Function). Blocked on M03 + M10.
- **DL-1 fix** — Persist module overrides to Supabase (M40 table) for cross-device sync.

### Medium priority
- **5.13** — E-Commerce Command Center. Blocked on M04 (BigCommerce) + M05 (GMC).
- **6.1/6.2** — GA4 + GSC integrations. Blocked on M06.
- **6.4** — Klaviyo integration. Blocked on M09.

### Cleanup / technical debt
- Delete `patch_quote.js` from repo root (safe dead code removal).
- Thread UUID linkage through customer ↔ quote ↔ deal cross-references.
- Consider extracting skill engine code into a shared `skills/_engine/` runtime as skill count grows.

---

## Skills roadmap (post-governance)

The skills directory has grown to 29 registered skills with 3 runtime-executable engines (airlock, efficiency-monitor, brainstorm-build-handoff). The governance restructuring may want to decide:

- Which skills belong in AccentOS vs a shared AgentOS skills repo
- Whether skill engines need a standard runtime contract (they currently vary)
- Whether skills should be versioned separately from AccentOS
