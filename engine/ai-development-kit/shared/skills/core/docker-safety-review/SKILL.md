---
name: docker-safety-review
description: Review Dockerfiles and Compose files for secret leakage, root usage, oversized images, unsafe mounts and production configuration mistakes.
---

# Docker Safety Review

Check:
- secrets copied into image
- `.env` copied into layers
- root runtime
- latest/unpinned base tags
- unnecessary build tools in runtime
- exposed DB/Redis ports in production
- broad bind mounts
- missing healthcheck
- missing stop/graceful shutdown considerations
- mutable writable app source
