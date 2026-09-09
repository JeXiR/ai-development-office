---
name: feature-generator
description: Orchestrate end-to-end feature delivery across project analysis, docs, database, backend, frontend/mobile, security, testing, observability and CI gates.
---

# Feature Generator

## Goal
Deliver a feature as an engineering change, not just a code patch.

## Required sequence

1. Understand feature intent
2. Run project analysis
3. Read relevant docs/references/ADRs
4. Run find-skill
5. Resolve required capabilities
6. Check conflicts
7. Define feature contract
8. Plan data changes
9. Run migration safety
10. Plan backend/API
11. Update API contract when relevant
12. Plan frontend/mobile UI
13. Implement security/authorization
14. Implement observability
15. Generate/update tests
16. Run code review
17. Run security audit
18. Run CI/local gates
19. Update docs/project state

## Feature output
A complete feature should account for:
- business rules
- data model
- permissions
- API contract
- UI/mobile states
- errors
- background work
- observability
- tests
- migration/deployment implications

## Rules
- do not skip analysis for large features
- do not generate migrations before understanding compatibility risk
- do not treat UI hiding as authorization
- do not add dependencies before capability/conflict checks
- do not mark feature complete while critical validation gates fail
