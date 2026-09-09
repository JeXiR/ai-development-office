---
name: docker-worker-scheduler
description: Model web, queue worker and scheduler as separate container roles using the same application image where practical.
---

# Worker / Scheduler Containers

Prefer one application image with different commands.

Example roles:
- web
- worker
- scheduler

Benefits:
- same release artifact
- easier rollback
- ECS/Fargate compatibility

Each role needs:
- command
- health/lifecycle behavior
- resource sizing
- logs
- graceful shutdown
