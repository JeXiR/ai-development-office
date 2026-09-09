---
name: debugging
description: Diagnose bugs systematically from evidence before modifying code.
---

# Debugging

1. Reproduce the failure.
2. Capture exact error, inputs, environment and route/job/command involved.
3. Identify the first incorrect state, not just the final exception.
4. Check recent relevant changes and existing logs.
5. Form a small number of testable hypotheses.
6. Verify with instrumentation, tests, or controlled reproduction.
7. Apply the smallest causal fix.
8. Add regression coverage.
9. Remove temporary debugging output.
10. Verify no adjacent behavior broke.

Do not randomly change configuration or dependencies hoping the error disappears.
