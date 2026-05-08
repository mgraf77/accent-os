# AccentOS Decisions Log
> Append-only. Format: date | decision | rationale | impact

---

## 2026-05-08 — AEOS Command Center Phase 1 shipped
**Decision:** Build AEOS Command Center, AI Router, and Handoff Generator in the existing vanilla JS stack (not Next.js).  
**Rationale:** Fastest path to value. Next.js migration deferred to AEOS Phase 2 when team has bandwidth. Current stack is proven and production-stable.  
**Impact:** New AEOS sidebar section (Owner/Admin/Manager). Three new pages. No schema required.

## 2026-05-08 — Model ID updated to claude-sonnet-4-6
**Decision:** Replace `claude-sonnet-4-20250514` with `claude-sonnet-4-6` across all AI fetch calls.  
**Rationale:** Prior model ID was deprecated/invalid, causing 400 errors on all AI features.  
**Impact:** All AI features (aiParseNotes, Knowledge Engine chat, Quote AI) now functional.

## 2026-05-08 — Organizational memory system created
**Decision:** Create `/memory/` directory with AI-readable markdown files for architecture, governance, AI workflows, decisions, vendors, operations.  
**Rationale:** AEOS Master Handoff requires persistent organizational memory for future RAG systems and agent memory retrieval.  
**Impact:** Foundation for future RAG layer. Current value: human-readable cross-session context.

## 2026-05-04 — Customer scores visible to Sales+
**Decision:** Employee scores visible to Owner/Admin/Manager only. Employees cannot see their own scores.  
**Rationale:** Prevents gaming, maintains management discretion.  
**Impact:** Employee module role-gated at Manager level.

## 2026-05-04 — Vanilla JS chosen over React/Next.js
**Decision:** No framework, no build step. Pure HTML/JS/CSS.  
**Rationale:** Zero dependencies, no terminal required for Michael, Cloudflare auto-deploy works immediately, no build failures. AccentOS is a line-of-business app, not a portfolio piece.  
**Impact:** All modules use compact-CRUD pattern. File size managed via external js/ split.

## 2026-04-29 — Agital / Go Fish Digital dismissed
**Decision:** All website and feed work done internally by Michael + Claude.  
**Rationale:** Agency added cost and no unique value over Claude-assisted internal development.  
**Impact:** All future ecommerce, SEO, and BigCommerce work is internal.

## 2026-04-XX — Supabase chosen over Firebase / PlanetScale
**Decision:** Supabase as the sole backend.  
**Rationale:** Free tier, native PostgreSQL, REST API works without SDK, MCP-accessible (when permissions fixed), row-level security built-in.  
**Impact:** All schema changes are SQL migrations. Michael runs them manually via SQL Editor until M11 (MCP permissions) is resolved.
