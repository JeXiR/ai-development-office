# Legacy to New Project Workflow

## Understand, then reimplement
1. Locate old feature.
2. Trace entry points, business rules and side effects.
3. Inspect related database schema.
4. Inspect authorization/security assumptions.
5. Inspect UI/UX behavior.
6. Identify integrations and background jobs.
7. List edge cases encoded in old code/tests.
8. Separate domain intent from legacy implementation.

## Compare with current project
- framework/runtime differences
- architecture differences
- database differences
- auth/tenant model differences
- dependency differences
- design system differences

## Reimplementation
Implement current architecture first.
Preserve required behavior, not obsolete structure.

## Regression
Add tests for important preserved behavior.
Document deliberate behavior changes.
