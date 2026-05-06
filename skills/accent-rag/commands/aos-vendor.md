---
name: aos-vendor
description: >
  Build or update a vendor entity page in wiki/entities/vendors/<slug>.md. Pulls vendor data
  from VD_RAW (in index.html) and Supabase tables (vendor_scores, vendor_overrides,
  vendor_score_states, vendor_changelog, vendor_parents). Idempotent — re-runs diff into
  the existing page rather than overwriting prose.
trigger: "/aos-vendor"
---

# /aos-vendor <vendor_id_or_slug>

## Steps

1. **Resolve the vendor.** If given a vendor_id (e.g. `137`), grep `index.html` for `id:137` in `VD_RAW`. If given a slug (e.g. `visual-comfort`), grep for the matching name. Capture: name, id, status, sales (recent year), parent (from vendor_parents).

2. **Slugify** the vendor name → kebab-case, drop INC/LLC/CORP/CO suffixes unless ambiguous. Verify uniqueness against `ls wiki/entities/vendors/`.

3. **Pull score data.** Read the latest vendor_scores rows for this vendor_id (14 rows, one per category) plus vendor_score_states for verified/unverified/na flags. Compute weighted average. Compute Tier (A/B/C) using the rules in [[concepts/vendor-tier-eligibility]].

4. **Pull overrides.** Read vendor_overrides row if any: notes, tags, tier_override, inactive flag.

5. **Pull changelog.** Last 10 entries from vendor_changelog for this vendor — these are user-relevant history.

6. **Pull parent + sister brands.** From vendor_parents.

7. **Compose / update `wiki/entities/vendors/<slug>.md`.** Frontmatter `type: entity`, `entity_kind: vendor`, fields filled from above. Body sections:
   - **Profile** — id, status, parent, sister brands, lifetime sales tier, primary rep
   - **Terms** — discount %, freight, returns, lead time, IMAP posture, marketing/co-op (each cell sources from the matching `[[rubric-<name>]]` page)
   - **Score breakdown** — table of 14 categories × score × state × last-verified date
   - **History** — last 10 changelog entries
   - **Linked records** — pipeline_deals open with this vendor, recent POs, recent quotes, active showroom_displays
   - **Open loops** — any "Unverified" categories, any contradictions in vendor_overrides notes
   - **Sources** — `[[sources/master]]`, `[[sources/build-intelligence]]`, plus any vendor-specific source pages

8. **Update `wiki/index.md`** — register the page if new; refresh the one-line summary if existing.

9. **Append to `wiki/log.md`:**
   ```
   ## [YYYY-MM-DD] aos-vendor | <vendor name>
   **Vendor:** <name> (id <id>)
   **Page:** wiki/entities/vendors/<slug>.md
   **Score:** <avg>/10 · Tier <A|B|C>
   **Unverified categories:** <count>
   ```

## Idempotency

A second run on the same vendor must NOT overwrite human-curated prose in the entity page. Strategy:
- Frontmatter is fully overwritten (it's a derived snapshot).
- Body sections labeled `<!-- auto: <section> -->` are auto-overwritten.
- Body sections without that marker are preserved verbatim.

This means human curators can add freeform "Notes" or "Negotiation history" sections that survive auto-refreshes.

## Anti-patterns

- Never include the vendor's IMAP/discount terms in plain prose without citing `[[rubric-...]]` pages — defeats the cluster topology.
- Never remove a freeform human-added section because it lacks the `<!-- auto: -->` marker. Preserve unknown sections.
- Never run on inactive vendors without setting `status: inactive` in frontmatter — downstream lint relies on this.
