---
name: aws-ecs
description: Deploy Docker workloads on AWS ECS/Fargate with task roles, health checks, autoscaling, logs and zero-downtime rollout considerations.
---

# AWS ECS/Fargate
- Separate web, worker and scheduler task definitions/services when lifecycle differs.
- Use task roles for AWS access.
- Send logs to centralized logging.
- Configure container and load-balancer health checks.
- Store secrets in managed secret/config services.
- Use immutable image tags/digests for releases.
- Define CPU/memory intentionally.
- Design graceful shutdown for workers and HTTP servers.
