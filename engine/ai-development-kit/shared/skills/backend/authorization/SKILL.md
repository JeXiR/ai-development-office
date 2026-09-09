---
name: authorization
description: Enforce roles, permissions, ownership and tenant boundaries consistently on the server.
---

# Authorization

- Authentication answers who; authorization answers what they may do.
- Enforce permissions on the server for every protected action.
- UI hiding is not authorization.
- Prefer policies/abilities near resources.
- Scope list/query access as well as detail/update/delete access.
- Prevent cross-tenant access explicitly.
- Avoid hard-coded role-name checks scattered across the codebase; centralize abilities when practical.
