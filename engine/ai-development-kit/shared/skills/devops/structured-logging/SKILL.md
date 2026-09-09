---
name: structured-logging
description: Design structured application logs with consistent fields, correlation IDs, severity and sensitive-data redaction.
---

# Structured Logging

Prefer structured fields:
- timestamp
- level
- service
- environment
- release
- request_id
- trace_id
- user_id only when appropriate
- tenant_id when operationally useful
- route/job
- error_class
- duration_ms

Avoid:
- secrets
- auth headers
- passwords
- full payment data
- raw private documents
- massive payload dumps

Use consistent event names for important workflows.
