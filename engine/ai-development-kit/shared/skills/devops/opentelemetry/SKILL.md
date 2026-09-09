---
name: opentelemetry
description: Add OpenTelemetry-based traces and metrics with controlled sampling, propagation and service boundaries.
---

# OpenTelemetry

Use when distributed visibility is valuable.

Trace:
- inbound requests
- outbound HTTP
- DB queries at safe abstraction level
- queue publish/consume
- background jobs

Metrics:
- request rate/error/latency
- queue depth/latency
- job failures
- DB pool usage
- external API failures

Do not instrument every tiny function.
Use sampling appropriate to traffic/cost.
