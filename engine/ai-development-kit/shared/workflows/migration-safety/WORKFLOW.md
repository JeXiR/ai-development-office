# Migration Safety Workflow

1. Identify DB engine/version when possible.
2. Read migration/schema diff.
3. Determine table/data scale when available.
4. Classify risky operations.
5. Assess lock/data-loss/backward-compatibility risk.
6. Choose direct migration or expand/migrate/contract.
7. Define backfill.
8. Define validation.
9. Define rollback/forward-fix plan.
10. Only then approve production execution.
