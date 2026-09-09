---
name: typed-api-client
description: Generate or maintain typed frontend/mobile API clients from the shared contract while preserving auth, errors and runtime boundaries.
---

# Typed API Client

Goals:
- contract-derived request/response types
- centralized base URL/auth handling
- consistent error parsing
- cancellation/timeouts where appropriate
- no secret credentials in client bundle

Do not duplicate backend DTO definitions manually when generation is reliable.
Generated files should be clearly marked and not hand-edited.
