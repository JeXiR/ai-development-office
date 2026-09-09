---
name: migration-safety-engine
description: Analyze database migrations for data loss, locking, downtime, backward compatibility and rollback risk before production execution.
---

# Migration Safety Engine

Run before risky schema changes.

## Detect high-risk operations
- DROP TABLE
- DROP COLUMN
- rename table/column
- type changes
- nullable -> not null
- shrinking string/decimal ranges
- changing primary/foreign keys
- unique constraint introduction
- index creation on large tables
- default changes requiring table rewrite
- destructive enum changes
- mass backfills
- cascade behavior changes

## Risk levels
- LOW
- MEDIUM
- HIGH
- BLOCKER

## Analyze
1. data-loss potential
2. lock duration / table rewrite risk
3. compatibility with old/new application versions
4. rollback feasibility
5. backfill requirements
6. index build strategy
7. replication/managed DB constraints
8. deployment ordering

## Preferred strategy
For risky production changes prefer:

EXPAND
- add new compatible schema

MIGRATE
- backfill / dual-write / move reads

CONTRACT
- remove obsolete schema later

## Rules
- Never run `migrate:fresh`, `db:wipe`, reset/drop-all equivalents in production.
- Never auto-run destructive migrations solely because tests pass.
- Separate large data backfills from schema migration when practical.
- Require explicit acknowledgement for BLOCKER changes.
- Backups do not make unsafe migrations safe; rollback strategy still matters.
