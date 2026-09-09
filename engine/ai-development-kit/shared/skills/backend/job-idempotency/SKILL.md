---
name: job-idempotency
description: Make background jobs safe to retry and safe against duplicate delivery.
---

# Job Idempotency

Prefer stable idempotency keys derived from business identity.

Patterns:
- unique DB constraint
- processed-event ledger
- atomic state transition
- distributed lock where justified
- provider idempotency key for external APIs

Never use "we probably enqueue once" as a guarantee.
