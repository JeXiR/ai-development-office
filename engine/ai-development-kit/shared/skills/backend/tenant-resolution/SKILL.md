---
name: tenant-resolution
description: Resolve the active tenant safely from domain, session, membership, token or request context.
---

# Tenant Resolution

Requirements:
- one canonical resolver
- deterministic precedence
- authenticated membership validation
- invalid/unknown tenant handling
- domain ownership verification where custom domains exist
- support/admin override clearly separated

Avoid scattered `tenant_id` parsing in controllers/components.
