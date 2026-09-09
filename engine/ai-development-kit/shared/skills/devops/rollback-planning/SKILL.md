---
name: rollback-planning
description: Define application, database, infrastructure and worker rollback strategy before risky releases.
---

# Rollback Planning

Consider separately:
- application image/code
- database schema/data
- infrastructure
- queue workers
- scheduler
- cache
- external integrations

A code rollback may not undo a destructive database migration.
