---
name: deployment
description: Design repeatable application deployments with build, config, migration, health check, rollback and observability steps.
---

# Deployment

A production deployment should define:
1. artifact/image build
2. environment/secrets
3. dependency install
4. schema migration strategy
5. cache/build warmup
6. application rollout
7. worker/scheduler rollout
8. health verification
9. smoke tests
10. rollback path

Avoid deployments that depend on undocumented manual SSH changes.
