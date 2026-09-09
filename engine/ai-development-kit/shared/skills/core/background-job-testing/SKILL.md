---
name: background-job-testing
description: Test queued work for idempotency, retries, failures, tenant context and concurrency-sensitive behavior.
---

# Background Job Testing

Critical tests:
- successful execution
- duplicate execution
- retry after transient failure
- permanent failure
- timeout path where practical
- tenant context restoration
- cross-tenant denial
- external API idempotency
- failed-job replay
