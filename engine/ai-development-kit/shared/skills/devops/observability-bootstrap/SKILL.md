---
name: observability-bootstrap
description: Bootstrap production observability across logs, metrics, traces, errors, releases, queues and health checks without leaking sensitive data.
---

# Observability Bootstrap

## Goal
Make failures diagnosable without drowning the system in noise.

## Signals
- structured logs
- error/crash reporting
- metrics
- traces
- health/readiness
- queue/job health
- deployment/release markers
- dependency/integration failures

## Principles
- observe user impact, not just infrastructure
- correlate requests/jobs with IDs
- never log secrets/tokens/passwords
- avoid logging full sensitive payloads
- separate expected business errors from system failures
- attach release/version/environment to events
- define ownership for alerts

## Recommended baseline
1. request/error logs
2. centralized exception reporting
3. release tag
4. health endpoint
5. queue failed-job monitoring
6. DB/API latency visibility
7. actionable alerts
