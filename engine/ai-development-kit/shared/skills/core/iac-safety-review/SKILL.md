---
name: iac-safety-review
description: Review infrastructure plans for destructive changes, security regressions, state risk and cost impact before apply.
---

# IaC Safety Review

Check plans for:
- destroy/replace
- public exposure
- IAM privilege expansion
- DB replacement
- bucket deletion
- security group widening
- DNS replacement
- lifecycle policy changes
- cost-heavy resources

Classify:
- BLOCKER
- HIGH
- MEDIUM
- LOW
