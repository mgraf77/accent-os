# optimization-history.md

> Record of every optimization applied to an AccentOS skill via skill-optimizer.
> One entry per optimization action (not per suggestion — a single action may address multiple suggestions).

---

## Schema

```
### [YYYY-MM-DD] — [skill-name] — [change type: direct_edit | skill-forge | deferred]
- skill: [skill-name]
- change_type: direct_edit | skill-forge | skill-eval-suite | deferred_to_future-builds
- suggestions_addressed: [list of suggestion IDs or codes]
- what_changed: [one sentence]
- target_section: [SKILL.md section modified]
- positive_signal_count: [N clean invocations before this optimization]
- outcome: [improved | no_change | regressed — assessed at next 3 invocations]
- session_date: [YYYY-MM-DD]
```

---

<!-- ENTRIES BELOW — newest appended at bottom -->
