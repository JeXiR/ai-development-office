---
name: environment-parity
description: Compare environment variable contracts across local, CI, Docker, staging and production without reading or exposing secret values.
---

# Environment Parity

Compare names, not secret values.

For each variable capture:
- name
- required/optional
- environment(s)
- public/private
- owner/module
- safe default?
- secret store mapping

Flag:
- required variable missing in an environment
- production-only secret used by local code without fallback
- public variable accidentally used for sensitive data
- stale example variable
- code references variable absent from environment contract
