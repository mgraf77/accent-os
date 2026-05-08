# BUILD HANDOFF — {{SKILL_NAME}}
Version: {{VERSION}}
Status: {{STATUS}}
Target Executor: {{TARGET_EXECUTOR}}
Generated: {{DATE}}

---

# EXECUTION DIRECTIVE

{{OBJECTIVE_ONE_LINER}}

---

# OBJECTIVE

{{OBJECTIVE_PARAGRAPH}}

---

# CONSTRAINTS

## Must Use
{{MUST_USE_LIST}}

## Must Not Use
{{MUST_NOT_USE_LIST}}

## Scope Boundary

{{SCOPE_BOUNDARY}}

---

# ARCHITECTURE

{{ARCHITECTURE_SUMMARY}}

## Entities

| Entity | Role | Owns |
|--------|------|------|
{{ENTITIES_TABLE}}

## Key Workflows

{{WORKFLOWS_LIST}}

## State

{{STATE_DIAGRAM_TEXT}}

---

# IMPLEMENTATION ORDER

{{IMPLEMENTATION_PHASES}}

---

# VALIDATION GATES

{{VALIDATION_GATES}}

---

# OPERATING RULES

{{OPERATING_RULES}}

---

# OPEN ITEMS

{{OPEN_ITEMS}}
<!-- If none: "None. Handoff is BUILD_READY." -->

---

# WHAT NOT TO BUILD

{{EXCLUSIONS}}

---

# NEXT PHASE

{{NEXT_PHASE}}
