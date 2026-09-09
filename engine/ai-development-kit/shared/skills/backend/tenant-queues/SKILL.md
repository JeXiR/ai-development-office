---
name: tenant-queues
description: Preserve and validate tenant context across queued jobs, retries, workers and scheduled tasks.
---

# Tenant Queues

Queue payloads should carry stable tenant/resource identifiers.

On execution:
1. restore tenant context
2. validate resource still belongs to tenant
3. apply authorization/business invariants
4. remain idempotent

Do not rely on ambient HTTP tenant context inside workers.
