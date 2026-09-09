---
name: background-jobs
description: Design recurring and background workloads that remain portable across cron, Laravel scheduler, Docker, VPS and AWS.
---

# Background Jobs

Separate:
- scheduler/trigger
- queue/broker
- worker
- business operation

The business operation must not depend directly on cron, systemd, ECS, Lambda or Plesk.

Define:
- frequency/trigger
- idempotency
- locking
- retry policy
- timeout
- failure alerting
- observability
