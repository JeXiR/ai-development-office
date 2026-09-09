---
name: database-performance
description: Diagnose database bottlenecks using query count, execution plans, indexing, cardinality, lock behavior and workload characteristics.
---

# Database Performance

Measure:
- slow queries
- total query count
- rows scanned/returned
- lock waits
- connection usage
- cache hit behavior where applicable

Fix root causes in this order when relevant:
1. N+1 / unnecessary queries
2. incorrect filtering/join strategy
3. missing or wrong indexes
4. excessive selected data
5. bad pagination
6. contention/transaction design
7. hardware/scaling
