---
name: postgres
description: Design and query PostgreSQL with constraints, indexes, query plans, JSONB discipline and concurrency awareness.
---

# PostgreSQL

- Prefer database constraints for invariant protection.
- Choose B-tree by default; use specialized indexes only for appropriate operators/data.
- Inspect `EXPLAIN (ANALYZE, BUFFERS)` for real performance work when safe.
- Use JSONB for flexible attributes, not to avoid relational modeling.
- Keep transactions short and understand lock behavior.
- Use partial/covering indexes when query patterns justify them.
- Treat RLS as a security boundary only when configured and tested rigorously.
