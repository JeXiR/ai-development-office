---
name: aws-iam
description: Design least-privilege AWS IAM roles and policies for users, workloads and CI/CD.
---

# AWS IAM
- Prefer workload roles over static access keys.
- Grant actions on the narrowest practical resources.
- Separate human, CI/CD and runtime identities.
- Use short-lived credentials.
- Require MFA for privileged humans.
- Never put AWS keys in repositories or client applications.
- Review wildcard actions/resources critically.
