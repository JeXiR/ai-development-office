---
name: docker-dev-prod
description: Separate developer convenience from production container architecture.
---

# Dev vs Production Docker

Development may include:
- bind mounts
- hot reload
- dev servers
- local DB/Redis

Production should avoid:
- source bind mounts
- dev dependencies when unnecessary
- hot reload
- exposed internal service ports
- debugging tools
