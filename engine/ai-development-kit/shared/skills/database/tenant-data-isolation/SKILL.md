---
name: tenant-data-isolation
description: Enforce tenant isolation in relational schemas, ORM queries, uniqueness and foreign-key relationships.
---

# Tenant Data Isolation

For shared-database tenancy:
- tenant-owned tables need tenant identity
- indexes should match tenant-scoped query patterns
- uniqueness often needs tenant_id included
- relations must not allow cross-tenant references
- bulk updates/deletes must be tenant scoped

For ORM:
- prefer centralized scoping where reliable
- still test negative cross-tenant access
- avoid hidden global scope bypasses in admin code
