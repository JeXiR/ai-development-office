---
name: roadmap-engine
description: Build and maintain a canonical roadmap from product docs, specifications, repository evidence and verified implementation state.
---

# Roadmap Engine

ROADMAP = where the product is going.
PROGRESS = where the implementation is now.

Canonical statuses:
- VERIFIED DONE
- PARTIAL
- TODO
- BLOCKED
- UNKNOWN
- DECISION REQUIRED

Verification rule:
docs says DONE + repository/test evidence = VERIFIED DONE
docs says DONE + insufficient implementation evidence = PARTIAL or UNKNOWN

Do not mark work complete from documentation alone.
