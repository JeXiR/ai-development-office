---
name: prisma
description: Use Prisma safely for schema modeling, migrations, generated clients, transactions and performant application queries.
---

# Prisma

- Inspect installed Prisma version before using version-specific APIs.
- Keep schema relations and database constraints aligned.
- Use migrations for durable schema evolution.
- Avoid selecting unnecessary columns/relations.
- Prevent N+1 patterns.
- Use transactions only for operations that require atomicity.
- Do not use `db push` as a substitute for managed production migrations.
- Regenerate client artifacts when schema changes require it.
