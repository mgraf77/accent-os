# Integration Rules — Lights America data52 and Vendor Price Books

Rules governing external data integrations into AccentOS.

---

## Data Source Separation Rules

**Flag as High if:**
- Lights America data52 feed data is mixed with manually-entered vendor data without provenance tracking
- Price book data does not carry source identifier
- Multiple feed sources share the same table columns without source tagging

**Required:** Every imported record must carry:
- `source` — e.g., `'lights_america_data52'`, `'vendor_price_book'`
- `imported_at` — timestamp of import
- `feed_version` or `feed_date` — version/date of the feed file

---

## Price Data Rules

**Flag as Critical if:**
- Price data is displayed without `effective_date` or `price_date`
- Price data has no staleness check (price last updated >7 days ago without indication)
- Price data is applied to quotes without confirming freshness

**Required columns:**
```sql
price_effective_date   DATE NOT NULL,
price_imported_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
price_source           TEXT NOT NULL,
```

**Flag as High if:**
- Price effective date is missing from any price record
- Prices are auto-applied to active quotes without user confirmation

---

## Stock Status Rules

**Flag as High if:**
- Stock status is displayed without `stock_checked_at` timestamp
- Stale stock data (>24h) is shown without a staleness indicator
- In-stock display is derived from stale data without a caveat

**Required:**
- All stock status records must carry `stock_checked_at TIMESTAMPTZ`
- Display must show "as of [date]" or equivalent freshness label
- Stale stock (>24h for fast-moving items) should be flagged in UI

---

## SKU Normalization Rules

**Flag as High if:**
- SKUs from different feeds are not normalized before storage
- SKU matching logic does not handle leading zeros, case differences, or prefix variations
- Duplicate SKUs exist in product table from different feed sources

**Required normalization:**
- Uppercase
- Trim whitespace
- Remove leading zeros where applicable
- Canonical form documented in `MASTER.md`

---

## Product Identifier Mapping Rules

**Flag as Medium if:**
- UPC, MPN, and vendor item number fields are not present or inconsistently populated
- No cross-reference table exists for mapping Accent SKU → vendor SKU → UPC

---

## Image and Document URL Rules

**Flag as High if:**
- Product image URLs are stored without a validation/health-check mechanism
- Product spec sheet URLs are stored without `url_verified_at` timestamp
- Dead image/doc URLs are displayed to employees without a fallback

**Required:**
- Validate URLs on import
- Re-validate on a schedule (weekly minimum)
- Display fallback when URL is unreachable

---

## Import Audit Log Rules

**Flag as High if:**
- No audit log exists for feed imports (what was imported, when, from where)
- Import errors are silently swallowed
- Import volume is not tracked (records added, updated, skipped, errored)

**Required import log fields:**
```sql
feed_name        TEXT NOT NULL,
imported_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
records_added    INT,
records_updated  INT,
records_skipped  INT,
records_errored  INT,
source_file      TEXT,
status           TEXT CHECK (status IN ('success', 'partial', 'failed')),
notes            TEXT,
```

---

## Rollback Rules

**Flag as Critical if:**
- A bulk import has no rollback path
- A feed import replaces existing data without archiving previous values

**Required rollback options (choose one):**
1. Soft-delete pattern: mark old records `deleted_at` before replacing
2. Snapshot pattern: write pre-import snapshot to an archive table
3. Versioned records: keep all historical values with `valid_from/valid_to`

---

## Stale Feed Handling Rules

**Flag as High if:**
- Code assumes the feed is always fresh without checking `imported_at`
- No alert exists for feeds that haven't updated within expected cadence
- Stale feed data triggers UI errors instead of graceful degradation

**Required:**
- Define expected feed cadence per source in config or docs
- Alert if feed is overdue
- Display graceful "data as of [date]" in UI for stale feeds

---

## Duplicate Product Handling Rules

**Flag as High if:**
- Import can create duplicate products (same SKU from different sources)
- Deduplication logic does not exist or is not tested
- Merging duplicate products loses data from either source

**Required deduplication strategy:**
1. Match on SKU (normalized) + source
2. If duplicate from same source: update existing record
3. If same SKU from different source: use cross-reference table
4. Log all deduplication decisions
