---
name: security-audit-pipeline
description: Run a layered application security review across dependencies, secrets, routes, auth, authorization, tenancy, headers, uploads and risky configuration.
---

# Security Audit Pipeline

## Layers
1. dependency vulnerabilities
2. secrets and credentials
3. authentication
4. authorization / IDOR
5. tenant isolation
6. input validation / mass assignment
7. route exposure / dangerous debug config
8. file upload security
9. session / cookie / CSRF posture
10. transport / security headers
11. logging / sensitive data exposure
12. framework-specific risky defaults

## Output
Classify findings:
- CRITICAL
- HIGH
- MEDIUM
- LOW
- INFO

Every finding should include:
- affected area
- reason
- realistic impact
- remediation
- confidence

Do not inflate severity without evidence.
