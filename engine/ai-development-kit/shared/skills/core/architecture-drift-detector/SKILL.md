---
name: architecture-drift-detector
description: Compare project documentation, generated profile, installed capabilities and repository reality to detect meaningful architecture drift.
---

# Architecture Drift Detector

Compare:
- `docs/architecture/STACK.md`
- `docs/architecture/STACK.generated.md`
- `.ai-kit/project-profile.json`
- `.ai-kit/installed-capabilities.json`
- package/composer manifests
- Docker/CI/cloud config

Flag:
- documented stack no longer installed
- installed stack not documented
- capability removed but config remains
- cloud target documented but unused
- deprecated dependency still referenced
- multiple competing systems

Do not treat every version change as architectural drift.
