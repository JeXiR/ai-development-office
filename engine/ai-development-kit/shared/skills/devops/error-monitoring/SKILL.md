---
name: error-monitoring
description: Integrate error monitoring such as Sentry while controlling sensitive context, release tagging and alert quality.
---

# Error Monitoring

Capture:
- unhandled exceptions
- high-value handled errors
- release/environment
- route/job context
- safe breadcrumbs
- user/tenant identifiers only when policy permits

Do not capture:
- credentials
- tokens
- secrets
- sensitive request bodies by default

Configure source maps/symbols where applicable.
Group noisy errors intelligently.
