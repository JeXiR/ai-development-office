---
name: migration-risk-analyzer
description: Classify Laravel, Prisma, MySQL and PostgreSQL migration operations by production risk.
---

# Migration Risk Analyzer

## Laravel
Inspect migration methods such as:
- drop/dropIfExists
- dropColumn
- renameColumn
- change
- nullable(false)
- unique
- foreign/cascade changes

## Prisma
Inspect generated SQL or schema diff for:
- destructive changes
- column/table drops
- required field additions
- enum changes
- relation changes
- index/unique constraints

## MySQL
Pay attention to:
- metadata/table locks
- full table rebuilds
- index creation behavior
- charset/collation changes

## PostgreSQL
Pay attention to:
- ACCESS EXCLUSIVE locks
- table rewrites
- index creation strategy
- constraint validation
- enum/type changes

Always reason from actual DB/version when known.
