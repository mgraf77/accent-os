# Supabase Rules

---

## Write Gateway Rules

### The only approved write path

```js
await dbInsert('table_name', payload);
await dbUpdate('table_name', id, payload);
await dbDelete('table_name', id);
```

### Patterns that MUST be flagged as Critical

```js
// Direct insert — CRITICAL
await supabase.from('vendors').insert(payload);

// Direct update — CRITICAL
await supabase.from('vendors').update(payload).eq('id', id);

// Direct delete — CRITICAL
await supabase.from('vendors').delete().eq('id', id);

// Direct upsert — CRITICAL
await supabase.from('vendors').upsert(payload);

// sbInsert helper used outside write gateway internals — HIGH
await sbInsert('vendors', payload);
```

The write gateway (`dbInsert`, `dbUpdate`, `dbDelete`) must:
- Validate `table` is a known/allowlisted table name
- Validate payload shape at minimum (no empty objects)
- Log errors to a structured error handler
- Return a consistent `{ data, error }` shape

---

## RLS Rules

### Required on every table

```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

**Flag as Critical if:**
- A `CREATE TABLE` migration does not enable RLS before deploying policies
- An `anon` role has INSERT, UPDATE, or DELETE permissions

**Flag as High if:**
- A table has RLS enabled but no policies (effectively blocks all access)
- A policy uses `USING (true)` for writes (no restriction)
- A policy grants `TO anon` for any write operation

**Flag as Medium if:**
- A table has policies but no read policy for `authenticated`
- A policy is undocumented in migration comments

### Approved pattern

```sql
-- Reads: all authenticated users
CREATE POLICY "authed read" ON [table]
  FOR SELECT TO authenticated USING (true);

-- Writes: role-gated
CREATE POLICY "authed write" ON [table]
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_id = auth.uid()
                 AND role IN ('Owner','Admin','Manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_id = auth.uid()
                      AND role IN ('Owner','Admin','Manager')));
```

---

## Migration Rules

### Required characteristics

1. **Idempotent** — safe to re-run without error
2. **Guards** — `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `CREATE INDEX IF NOT EXISTS`
3. **Re-runnable** — dropping and recreating policies before creating is acceptable
4. **Commented** — each table block should have a comment explaining purpose
5. **Reviewed** — policies reviewed for role coverage

**Flag as High if:**
- Migration lacks `IF NOT EXISTS` / `IF EXISTS` guards
- Migration creates a table without enabling RLS
- Migration has no comment block explaining what it does

**Flag as Medium if:**
- Migration does not define indexes for tables with obvious lookup patterns
- Migration does not define foreign keys where relationships are clear
- Migration file name does not follow `M[NN]_[description].sql` convention

### Required index patterns

Tables with vendor_id, customer_id, employee_id, user_id, or created_at lookups need indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_[table]_[column] ON [table]([column]);
```

---

## Service Role Key Rules

**Flag as Critical if:**
- Supabase service role key (`service_role` or `SUPABASE_SERVICE_KEY`) appears in:
  - `index.html`
  - Any JS module file
  - Any client-side code
  - Git history (run `git log -p | grep -i service_role`)

The service role key may only appear in:
- Cloudflare Worker environment variables (via Wrangler secrets)
- Server-side scripts that never touch the client bundle

---

## Supabase Client Exposure Rules

**Flag as High if:**
- The Supabase client is initialized outside a controlled bootstrap function
- The Supabase URL or anon key is hardcoded in multiple places (should be single init)
- `supabase.auth` methods are called without error handling
- Realtime subscriptions are created without cleanup on module destroy
