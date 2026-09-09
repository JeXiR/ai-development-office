---
name: decision-resolver
description: Resolve DECISION REQUIRED items from project specifications and existing architecture before implementation continues.
---

# Decision Resolver

For each unresolved decision:
1. search project docs and ADRs
2. determine whether the decision is already implied or explicitly made
3. if not, classify:
   - safe default
   - project-level choice
   - user/business choice
4. choose a safe technical default only when reversible and low-risk
5. write the decision to the correct ADR/feature/progress location

Do not repeatedly ask the user about low-risk reversible implementation details.
Escalate only material irreversible/product/business choices.
