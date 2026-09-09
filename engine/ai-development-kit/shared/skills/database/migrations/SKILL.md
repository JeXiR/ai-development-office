---
name: migrations
description: Plan safe, reversible database migrations for local, CI and production environments.
---

# Migrations

Before changing schema:
1. inspect existing migrations/schema
2. estimate data volume and lock risk
3. determine backward compatibility during rollout
4. plan data backfill separately when large

Prefer expand/migrate/contract for risky production changes.
Do not drop/rename critical columns in the same deployment that old application instances may still use.
Backups are not a substitute for safe migration design.
