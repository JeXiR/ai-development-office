---
name: job-concurrency
description: Control duplicate and concurrent job execution using uniqueness, locks and resource-level serialization.
---

# Job Concurrency

Decide whether jobs may:
- run concurrently
- be unique while queued
- be unique while processing
- serialize by resource/tenant

Lock keys must be scoped correctly.
Locks need expiry/recovery.
Do not create global locks for tenant-local work unless necessary.
