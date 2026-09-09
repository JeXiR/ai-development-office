---
name: template-generator
description: Generate a new project baseline from a selected preset, docs template, AI adapters, selective skills and optional Docker starter files.
---

# Template Generator

## Sequence
1. choose preset
2. create project directory
3. create `.ai-kit/project-profile.json`
4. create `.ai-kit/skill-overrides.json`
5. install docs
6. install Cursor/Claude adapters
7. install selected skills
8. copy optional starter/template files
9. add Docker starter when preset requires it
10. validate
11. after real framework scaffolding, re-run analyzer/sync

Do not pretend placeholder templates are full framework scaffolds unless the framework CLI has actually been run.
