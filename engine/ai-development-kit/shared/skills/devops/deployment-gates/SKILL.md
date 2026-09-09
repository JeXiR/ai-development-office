---
name: deployment-gates
description: Define required validation gates before production deployment.
---

# Deployment Gates

Potential blockers:
- failing tests
- failing build/typecheck
- high/critical dependency vulnerabilities
- detected hard-coded secrets
- migration BLOCKER findings
- missing required environment contract
- image build failure
- smoke test failure

Production deployment should not bypass blockers silently.
