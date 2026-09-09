---
name: tenant-test-strategy
description: Define required cross-tenant negative tests for APIs, queries, cache, queues and storage.
---

# Tenant Test Strategy

Every critical tenant feature should include tests for:
- tenant A cannot read tenant B
- tenant A cannot update/delete tenant B
- list endpoints do not leak tenant B rows
- cache keys do not collide
- queued jobs restore correct tenant
- storage URLs/files cannot cross tenants
- admin/support override is explicit
