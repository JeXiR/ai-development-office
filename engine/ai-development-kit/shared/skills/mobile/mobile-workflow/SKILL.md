---
name: mobile-workflow
description: Coordinate mobile feature development across design, navigation, API, auth, storage, permissions, offline behavior, QA and release concerns.
---

# Mobile Workflow

Before implementation:
1. Read project state/docs.
2. Inspect navigation architecture.
3. Inspect API/auth/storage conventions.
4. Inspect design system and existing screens.
5. Identify device capabilities/permissions needed.
6. Determine offline expectations.
7. Search for reusable components and hooks.
8. Ask only material unresolved product decisions.

Implementation sequence:
1. data/API contract
2. auth/authorization implications
3. navigation/deep-link behavior
4. storage/cache/offline model
5. screen/components
6. permissions/device integrations
7. loading/error/empty/offline states
8. analytics/observability if required
9. tests
10. mobile QA
