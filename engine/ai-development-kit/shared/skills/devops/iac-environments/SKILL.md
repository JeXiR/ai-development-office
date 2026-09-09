---
name: iac-environments
description: Structure infrastructure for dev, staging and production with isolated state and controlled configuration differences.
---

# IaC Environments

Each environment should define:
- account/region
- state
- networking
- sizing
- secrets mapping
- domains
- observability
- deletion protection
- cost profile

Do not reuse production state for staging/dev.
