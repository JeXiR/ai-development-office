---
name: kit-doctor
description: Run comprehensive self-diagnostics across skill registry, scripts, adapters, templates, manifests, references and project integration.
---

# Kit Doctor

## Purpose
Validate the AI Development Kit itself before release or installation.

Check:
- manifest version
- skill registry integrity
- duplicate skill names
- missing SKILL.md files
- broken paths/references
- Cursor/Claude adapter parity
- PowerShell script syntax/basic invocation safety
- template existence
- capability/preset registry references
- project bootstrap/install/sync assumptions
- roadmap/readme version consistency

The doctor must fail loudly on structural inconsistencies.
