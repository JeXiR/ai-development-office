---
name: architecture
description: Design maintainable application architecture while preserving existing project conventions and minimizing unnecessary abstraction.
---

# Architecture

## Principles
- Understand the current architecture before proposing a new one.
- Prefer clear boundaries over excessive layering.
- Keep domain/business logic independent from UI, cloud provider, queue driver, storage driver, and deployment platform.
- Introduce abstractions only when they reduce real coupling or duplication.
- Preserve framework conventions unless there is a documented reason not to.
- Make side effects explicit.
- Keep modules cohesive and dependencies directional.

## Before a structural change
1. Read relevant docs and ADRs.
2. Identify current module boundaries.
3. Trace dependencies and data flow.
4. Identify the smallest change that meets the requirement.
5. Record material architectural decisions in `docs/decisions/`.

## Avoid
- speculative interfaces
- service/repository layers with no meaningful responsibility
- duplicated domain models
- circular module dependencies
- direct cloud SDK usage throughout business logic
