---
name: code-review
description: Review changes for correctness, regressions, security, maintainability, performance and consistency with project conventions.
---

# Code Review

Review in this order:
1. correctness and broken behavior
2. security and authorization
3. data integrity
4. concurrency/idempotency
5. backward compatibility
6. performance
7. maintainability
8. readability/style

Flag concrete issues with file/area, impact, and recommended fix.
Do not waste review attention on cosmetic preferences already handled by formatters.
