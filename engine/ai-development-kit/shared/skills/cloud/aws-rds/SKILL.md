---
name: aws-rds
description: Run relational databases on AWS RDS/Aurora with secure networking, backups, monitoring and migration discipline.
---

# AWS RDS
- Keep DB private unless a documented reason requires public access.
- Use security groups with least-privilege network access.
- Enable backups and define retention/restore testing.
- Use encryption.
- Monitor connections, CPU, storage, latency and slow queries.
- Use connection pooling where workload requires it.
- Treat schema migration strategy separately from database provisioning.
