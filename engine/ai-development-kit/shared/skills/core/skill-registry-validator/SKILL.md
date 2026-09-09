---
name: skill-registry-validator
description: Validate skill names, categories, duplicates and filesystem consistency.
---

# Skill Registry Validator

Rules:
- every registered skill has exactly one SKILL.md
- every SKILL.md name is unique
- registry categories contain no duplicates
- skill folder/name mismatch is allowed only when documented
- orphan skill files should be reported
