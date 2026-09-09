---
name: authorization-auditor
description: Audit server-side authorization for ownership, roles, policies, abilities, IDOR and tenant-boundary failures.
---

# Authorization Auditor

Inspect protected read/write/delete/export/admin operations.

Check:
- authentication present where needed
- policy/gate/ability or equivalent server-side enforcement
- ownership checks
- list/query scoping
- tenant scoping
- admin privilege checks
- bulk actions
- exports/downloads
- indirect resource access

UI hiding is not authorization.
Route middleware alone may be insufficient for resource-level access.
