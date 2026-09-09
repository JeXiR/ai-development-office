---
name: tenant-authorization
description: Combine tenant membership, roles, permissions and resource ownership into server-side authorization.
---

# Tenant Authorization

Check:
- user belongs to tenant
- role/permission valid in that tenant
- resource belongs to same tenant
- support/admin override is explicit
- list queries are scoped before filtering/pagination

A user being authenticated does not imply access to every tenant.
