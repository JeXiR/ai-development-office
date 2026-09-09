---
name: regression-test-planner
description: Turn bugs and production incidents into minimal durable regression tests.
---

# Regression Test Planner

For a bug:
1. capture failing behavior
2. identify smallest stable boundary
3. reproduce with a failing test
4. fix
5. keep the test
6. avoid asserting incidental implementation details

Regression tests should explain what must never break again.
