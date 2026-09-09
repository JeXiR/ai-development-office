---
name: capability-conflict-detector
description: Detect dependency, architecture, auth, storage, cache, queue, UI and animation conflicts before installing a capability.
---

# Capability Conflict Detector

Run before adding any modular capability.

## Detect conflicts in these dimensions

### Package duplication
Examples:
- Motion + Framer Motion overlap
- multiple Redis clients
- multiple auth client libraries
- multiple UI primitive systems
- multiple chart libraries for the same use

### Architecture conflicts
Examples:
- Sanctum added to a project already using another auth architecture
- Prisma introduced into a project with a different established ORM
- S3 integration bypassing an existing storage abstraction
- Redis configuration replacing database cache/queue without migration intent

### UI conflicts
Examples:
- shadcn introduced into a project with a mature incompatible design system
- multiple animation libraries in a simple product UI
- multiple icon libraries

### Mobile conflicts
Examples:
- Expo package incompatible with SDK
- duplicate secure-storage solutions
- navigation library duplication

## Classification

- BLOCKER: should not proceed without a decision
- WARNING: can proceed but tradeoff must be explicit
- INFO: benign overlap or migration note

## Output
For each issue:
- capability
- conflicting existing dependency/config
- severity
- reason
- recommended resolution
