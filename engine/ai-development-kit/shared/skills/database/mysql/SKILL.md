---
name: mysql
description: Design and query MySQL schemas with correct types, indexes, constraints, transaction boundaries and production performance.
---

# MySQL

- Choose types based on real domain range and semantics.
- Use foreign keys when they protect integrity and match operational needs.
- Index columns used by selective filters, joins, ordering and uniqueness.
- Avoid redundant indexes.
- Inspect query plans for slow/high-volume queries.
- Avoid N+1 access patterns.
- Keep transactions short.
- Plan online/low-lock schema changes for large tables.
- Use UTC for persisted timestamps unless domain requirements demand otherwise.
