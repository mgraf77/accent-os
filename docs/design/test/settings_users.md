# Golden-Path: Settings → Users
> Module key: `settings_users_v2` · Phase 4 sixth (last) migration · ≤5 min run.
> **Last on purpose.** Touches auth + roles. Misconfig = privilege escalation or lockout.

```
[ ] 1. Pre-flight: Owner can log in fresh; anon JWT (`sessionStorage['aos-sb-key']`) loads; audit_log writing
[ ] 2. Desktop: open Settings → Users; user list renders 3 seeded users (Michael=Owner, Paul=Admin, Patrick=Admin)
[ ] 3. Role assignment UI: dropdown shows 5 roles; change is persisted to `user_profiles`; audit_log row written
[ ] 4. Per-user override panel: list current overrides from `accentos_user_overrides`; allow/deny/clear actions visible
[ ] 5. Mobile 390px: user rows readable; role dropdown usable; override actions accessible
[ ] 6. Role visibility: Owner-only. Admin pasting `#/settings/users` is blocked; sidebar entry absent for Admin
[ ] 7. Self-demote guard: Owner cannot demote self below Owner without explicit confirm + audit row
[ ] 8. Mount/unmount: edit a user, navigate away, return; form state cleared; no stale Supabase update fires
[ ] 9. JSON parse + Supabase parity: `user_profiles` row count matches UI count exactly; no orphan rows
[ ] 10. Rollback dry-run: flip back; v1 Settings → Users remains; user-permission state on Supabase unchanged
```

**Module-specific risk highlights:**
- **P0 surfaces:** privilege escalation, Owner lockout, audit_log gap. All three = instant rollback + Captain.
- F4 role visibility is the entire point of this module — re-test all 5 roles after every flip without exception.
- F3 divergence: only one Settings surface visible per user at a time. `module_modes` resolver enforces.
- localStorage overrides v1 are still Owner-machine-only (M30 candidate not landed) — call this out in UI copy.

**Rollback paste-block:**
```
# module_modes.json: settings_users_v2.mode = "<prior_mode>"
git commit -m "revert: settings_users_v2 to <prior_mode>"
```
