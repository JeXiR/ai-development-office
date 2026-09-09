---
name: infrastructure-as-code
description: Manage reproducible infrastructure with Terraform/OpenTofu using modular environments, remote state, least privilege and reviewable plans.
---

# Infrastructure as Code

## Principles
- infrastructure changes are code changes
- prefer reusable modules
- separate dev/staging/prod state
- review plan before apply
- no secrets in tfvars/source
- use remote state + locking where appropriate
- tag resources consistently
- keep application and infrastructure boundaries explicit
- avoid click-only production changes that cannot be reproduced

## Workflow
1. detect target environment
2. validate provider/module versions
3. init/validate/fmt
4. plan
5. review security/cost/destructive changes
6. apply only with explicit deployment intent
7. verify outputs/health
