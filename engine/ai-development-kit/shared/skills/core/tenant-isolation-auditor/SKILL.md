---
name: tenant-isolation-auditor
description: Audit multi-tenant applications for cross-tenant data exposure across queries, cache, queues, storage, exports and background jobs.
---

# Tenant Isolation Auditor

Check tenant boundaries in:
- DB queries
- ORM scopes
- cache keys
- queue payloads
- storage paths/object keys
- exports
- notifications
- scheduled jobs
- search indexes
- API resource access

Danger signals:
- lookup by global ID without tenant scope
- shared cache key missing tenant identity
- storage path missing tenant namespace
- queued job re-fetching resource without tenant boundary
- admin bypass logic scattered throughout application
