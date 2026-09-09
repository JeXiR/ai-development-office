---
name: aws-rds-iac
description: Provision RDS/Aurora with private networking, backups, encryption, monitoring and safe lifecycle policies.
---

# RDS IaC

Define:
- engine/version
- instance class
- storage
- subnet group
- security group
- backup retention
- deletion protection
- encryption
- monitoring
- parameter groups

Do not allow public access by default.
Avoid accidental destroy/recreate of production DBs.
