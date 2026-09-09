---
name: authentication
description: Implement secure authentication appropriate to Laravel, Next.js, APIs, SPAs and mobile clients.
---

# Authentication

Choose auth mechanism by client:
- server-rendered web: secure session/cookie auth
- same-origin SPA: session/Sanctum-style approach where appropriate
- public/mobile API: scoped tokens/OAuth/OIDC as required

Requirements:
- secure password hashing
- session rotation after login/privilege changes
- logout/session invalidation
- rate limiting for login/recovery
- verified reset tokens with expiry
- MFA/biometrics only as an additional factor or local unlock where appropriate
- never store long-lived sensitive tokens in insecure browser storage
