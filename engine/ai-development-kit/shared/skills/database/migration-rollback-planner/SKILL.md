---
name: migration-rollback-planner
description: Create rollout, backfill and rollback plans for production database changes.
---

# Migration Rollback Planner

For each migration define:
- preconditions
- deployment order
- application compatibility window
- data backfill
- validation
- rollback path
- point of no return

Rollback may mean:
- schema rollback
- application rollback
- restore from backup
- forward-fix

Do not claim a rollback is safe when data transformation is irreversible.
