---
name: security
description: Review application changes for authentication, authorization, secrets, input validation, data exposure, and common web security risks.
---

# Security

## Mandatory checks
- authenticate where identity is required
- authorize every protected action server-side
- validate untrusted input
- encode/escape output according to context
- use parameterized queries / framework ORM safely
- protect state-changing browser requests from CSRF where applicable
- avoid IDOR by scoping resource access to the current principal/tenant
- never expose secrets in source, logs, URLs, or client bundles
- use secure cookie/session settings
- rate-limit sensitive endpoints where appropriate
- avoid mass-assignment vulnerabilities
- validate uploaded file type, size, and access policy

## Multi-tenant systems
Every tenant-owned query must have explicit tenant scope or an equivalent enforced boundary.

## Dependencies
Prefer maintained framework-native security mechanisms and keep packages current.
