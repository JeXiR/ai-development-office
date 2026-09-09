---
name: aws-ec2
description: Operate EC2 hosts when VM-level control is needed while preserving reproducibility and least privilege.
---

# AWS EC2
Use EC2 when workload or operational needs justify VM control.
- avoid SSH as the primary deployment mechanism
- use repeatable provisioning
- restrict inbound security groups
- patch base OS
- use IAM roles instead of static keys
- centralize logs/metrics
- plan backups and instance replacement
