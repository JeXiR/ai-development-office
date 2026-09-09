---
name: test-gap-analyzer
description: Compare project risks and critical flows against existing test files to identify meaningful missing coverage.
---

# Test Gap Analyzer

Detect:
- critical module with no tests
- route/controller without feature coverage
- authorization policy without negative-path tests
- tenant-aware feature without cross-tenant denial tests
- queue job without retry/idempotency coverage
- migration without data-preservation test where needed
- frontend form without validation/error-state coverage
- mobile auth/deep-link/offline flow without tests

Ignore:
- trivial getters
- framework boilerplate
- generated code unless customized
