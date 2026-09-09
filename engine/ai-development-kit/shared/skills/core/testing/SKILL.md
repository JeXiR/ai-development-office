---
name: testing
description: Add focused automated tests that protect behavior and prevent regressions without overspecifying implementation details.
---

# Testing

## Priorities
1. business-critical behavior
2. authorization/security boundaries
3. edge cases and regressions
4. API contracts
5. integration boundaries

## Rules
- Test behavior, not private implementation details.
- Reproduce a bug with a failing test when practical before fixing it.
- Keep fixtures minimal.
- Avoid fragile timing-based tests.
- Use unit tests for isolated logic and integration/feature tests for framework behavior.
- Run the narrowest relevant suite first, then broader validation when the change is stable.
