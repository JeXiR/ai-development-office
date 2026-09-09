---
name: terraform
description: Author Terraform/OpenTofu modules, environments, variables, outputs and state safely.
---

# Terraform / OpenTofu

Prefer:
- small cohesive modules
- typed variables
- explicit outputs
- version constraints
- provider constraints
- remote state
- minimal sensitive outputs

Avoid:
- monolithic root modules
- hard-coded account IDs/regions
- secrets in state where avoidable
- implicit cross-environment coupling
