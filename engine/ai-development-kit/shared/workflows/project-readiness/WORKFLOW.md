# Project Readiness Workflow

Trigger:
- `check project readiness`

1. discover/sync project docs if needed
2. extract required capabilities
3. compare against capability registry
4. verify scaffold/template/generator/validator evidence
5. compose compatible preset
6. write `.ai-kit/project-readiness.json`
7. if MISSING/PARTIAL/CONFLICT -> run kit-gap-analysis, do not scaffold
8. if READY -> set next action to approved scaffold
