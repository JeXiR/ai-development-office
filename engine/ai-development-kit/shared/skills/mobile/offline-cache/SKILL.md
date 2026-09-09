---
name: offline-cache
description: Design offline-aware mobile data flows with cache freshness, mutation queues, conflict handling and reconnect behavior.
---

# Offline & Cache

For each dataset define:
- source of truth
- freshness window
- stale display policy
- persistence requirement
- reconnect refresh behavior

For offline mutations define:
- queue durability
- idempotency
- conflict strategy
- retry/backoff
- user-visible pending/failed state

Do not promise offline support by merely caching GET responses.
