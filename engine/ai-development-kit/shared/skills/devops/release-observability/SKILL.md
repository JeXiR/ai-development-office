---
name: release-observability
description: Correlate deployments and releases with errors, latency and regressions.
---

# Release Observability

Every release should have:
- version/commit SHA
- deploy timestamp
- environment
- build/image identifier

Use release markers in:
- error monitoring
- logs
- metrics
- traces

Compare pre/post deploy signals.
Rollback or forward-fix decisions should use evidence.
