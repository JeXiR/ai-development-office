---
name: background-job-reliability
description: Design reliable asynchronous work with idempotency, retries, timeouts, duplicate protection, failure handling and observability.
---

# Background Job Reliability

Every important job should define:
- idempotency behavior
- retry policy
- backoff
- timeout
- duplicate/concurrency behavior
- failure destination
- tenant/user context when applicable
- observability
- recovery procedure

Assume jobs may execute more than once.
Assume workers may die mid-execution.
Do not rely on in-memory request state.
