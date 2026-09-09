---
name: linux
description: Operate Linux application hosts safely with reproducible service, permission, log, process and filesystem practices.
---

# Linux

- Inspect before modifying.
- Prefer least privilege.
- Do not run application processes as root unless technically required.
- Keep ownership/permissions intentional.
- Use systemd/supervisor/container orchestration for long-running processes.
- Rotate logs.
- Monitor disk/inode/memory/CPU.
- Document nonstandard system changes.
- Avoid destructive wildcard commands on uncertain paths.
