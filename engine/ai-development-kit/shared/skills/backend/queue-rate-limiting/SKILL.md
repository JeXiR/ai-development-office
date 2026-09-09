---
name: queue-rate-limiting
description: Protect downstream services and tenants with queue-level rate limiting and controlled throughput.
---

# Queue Rate Limiting

Apply limits by:
- external provider
- tenant
- resource type
- global system capacity

Honor provider 429/retry guidance.
Avoid one tenant starving all others.
