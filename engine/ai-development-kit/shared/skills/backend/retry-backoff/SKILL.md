---
name: retry-backoff
description: Define bounded retries and backoff policies that distinguish transient from permanent failures.
---

# Retry & Backoff

Retry transient failures:
- network timeout
- rate limit
- temporary dependency outage
- lock contention

Usually do not retry blindly:
- invalid payload
- authorization failure
- missing permanent resource
- deterministic business-rule rejection

Use bounded exponential/backoff with jitter where appropriate.
Avoid retry storms.
