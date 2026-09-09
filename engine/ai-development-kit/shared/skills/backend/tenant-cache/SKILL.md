---
name: tenant-cache
description: Prevent cross-tenant cache contamination using explicit namespacing and invalidation ownership.
---

# Tenant Cache

Cache keys for tenant data should include tenant identity.

Example pattern:
`tenant:{tenantId}:invoice:{invoiceId}`

Also review:
- tags/namespaces
- invalidation
- shared reference data vs tenant-owned data
- per-user-in-tenant cache
