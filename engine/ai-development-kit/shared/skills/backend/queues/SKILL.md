---
name: queues
description: Design reliable asynchronous queues and Laravel jobs with retries, idempotency, observability and failure handling.
---

# Queues

- Queue only work that can safely be asynchronous.
- Define retry/backoff behavior intentionally.
- Make jobs idempotent.
- Store durable identifiers, not large serialized object graphs.
- Re-fetch state when execution occurs.
- Define timeout and failure handling.
- Prevent duplicate jobs when duplicate execution is costly.
- Monitor queue depth, failed jobs and processing latency.
- Separate queue classes by workload when necessary.
