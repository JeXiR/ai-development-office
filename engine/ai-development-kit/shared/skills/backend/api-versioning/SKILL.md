---
name: api-versioning
description: Manage API evolution, compatibility, deprecation and versioning without unnecessary version proliferation.
---

# API Versioning

Prefer additive, backward-compatible evolution when possible.

Potential breaking changes:
- removing endpoint/field
- renaming field
- changing field type
- optional -> required request input
- nullable -> non-null response assumption
- changing enum semantics
- changing auth requirements
- changing status/error contract

Do not create a new API version for every additive field.
Use explicit deprecation windows for externally consumed APIs.
