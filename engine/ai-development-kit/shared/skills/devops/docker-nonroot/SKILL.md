---
name: docker-nonroot
description: Run application containers as non-root users while preserving required file permissions.
---

# Non-Root Containers

Prefer non-root runtime users.

Review:
- writable storage/cache dirs
- temp dirs
- logs
- socket/port needs
- framework cache/build directories

Do not chmod 777 as a shortcut.
