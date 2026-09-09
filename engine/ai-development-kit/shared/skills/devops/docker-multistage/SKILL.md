---
name: docker-multistage
description: Design efficient multi-stage Docker builds that separate dependencies, build tooling and runtime artifacts.
---

# Multi-Stage Builds

Use stages such as:
- deps
- build
- runtime

Benefits:
- smaller runtime image
- fewer build tools in production
- better cache reuse

Rules:
- copy only required artifacts
- keep lockfile-driven installs deterministic
- avoid reinstalling dependencies in runtime when not needed
