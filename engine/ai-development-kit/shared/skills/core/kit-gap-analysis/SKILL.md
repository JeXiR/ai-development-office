---
name: kit-gap-analysis
description: Identify missing or partial AI Development Kit capabilities required by a project and produce a prioritized kit-upgrade plan.
---

# Kit Gap Analysis

When readiness is not READY:

For each gap:
- identify required capability
- classify MISSING / PARTIAL / CONFLICT
- identify missing scaffold/template/generator/validator/skill
- estimate whether a reusable kit capability should be added
- avoid project-specific hacks inside the global kit

Output:
- gap list
- reusable kit change
- project impact
- dependency order
- next action

Do not scaffold around a missing foundational capability merely to make the project start.
