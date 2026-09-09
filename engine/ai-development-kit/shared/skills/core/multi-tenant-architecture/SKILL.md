---
name: multi-tenant-architecture
description: Design and review tenant-aware systems across resolution, database, authorization, cache, queues, storage, APIs and tests.
---

# Multi-Tenant Architecture

## Tenant models
Choose deliberately:
- shared database + tenant_id
- schema-per-tenant
- database-per-tenant
- hybrid

Do not mix strategies accidentally.

## Tenant resolution
Possible resolvers:
- subdomain
- custom domain
- authenticated membership
- header/API token context
- explicit admin impersonation

Resolution must be centralized and auditable.

## Boundaries
Tenant context must flow through:
- DB queries
- authorization
- cache keys
- queues/jobs
- storage paths
- exports
- notifications
- search indexes
- logs/metrics where operationally useful

## Rules
- never trust client-provided tenant IDs without server validation
- never scope only the UI
- default to deny when tenant context is missing for tenant-owned resources
- admin/support bypasses must be explicit and logged
