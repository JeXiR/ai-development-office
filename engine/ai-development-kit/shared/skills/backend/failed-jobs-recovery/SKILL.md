---
name: failed-jobs-recovery
description: Design failed-job/dead-letter handling, replay safety and operator recovery procedures.
---

# Failed Jobs & Recovery

Capture enough safe context to diagnose:
- job type
- resource identifiers
- tenant identifier when appropriate
- attempts
- failure class
- timestamps
- release

Replay must pass the same idempotency and authorization invariants.

Define:
- retry from failed queue
- discard criteria
- manual repair criteria
- poison-message handling
