---
name: openapi
description: Design and maintain OpenAPI contracts with reusable schemas, consistent errors, pagination and authentication definitions.
---

# OpenAPI

Prefer:
- OpenAPI 3.1 when tooling supports it
- reusable component schemas
- consistent error envelope
- explicit security schemes
- examples that contain no secrets/private data
- operation IDs stable enough for client generation

Avoid:
- undocumented polymorphic responses
- `object` without meaningful schema
- inconsistent pagination
- 200 responses for every error
