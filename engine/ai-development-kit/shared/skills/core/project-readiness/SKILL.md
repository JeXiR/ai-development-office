---
name: project-readiness
description: Compare project requirements against actual AI Development Kit capabilities, presets, scaffolds, generators and validators before allowing scaffold.
---

# Project Readiness

Use for:
- `check project readiness`
- pre-scaffold validation
- dogfooding a new project against the kit

Steps:
1. discover project requirements from docs/profile
2. resolve required capabilities
3. inspect capability registry and implementation evidence
4. inspect compatible presets/compositions
5. classify READY/PARTIAL/MISSING/CONFLICT
6. write `.ai-kit/project-readiness.json`
7. block scaffold when required capability is missing/conflicting

Skill presence alone is not readiness evidence.
