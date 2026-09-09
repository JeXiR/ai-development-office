---
name: security-route-config-auditor
description: Detect risky route exposure, debug configuration, unsafe CORS, permissive middleware and production-dangerous framework settings.
---

# Route & Config Auditor

Look for:
- debug enabled in production intent
- permissive CORS
- unauthenticated admin/debug routes
- development-only routes exposed
- test endpoints
- route groups missing expected auth middleware
- unsafe proxy/trust settings
- session/cookie security weaknesses
- wildcard host/origin behavior
- internal tooling exposed publicly
