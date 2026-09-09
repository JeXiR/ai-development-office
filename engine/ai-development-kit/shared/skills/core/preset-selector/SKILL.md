---
name: preset-selector
description: Select an AI Development Kit project preset based on desired backend, frontend, database, Docker, cloud and mobile architecture.
---

# Preset Selector

Use when creating a new project or standardizing a new project baseline.

## Inputs
- project type
- backend
- frontend
- database
- ORM
- Docker requirement
- cloud target
- mobile target

## Rules
- prefer the closest preset, not an exact-but-overcomplicated one
- presets are starting points, not permanent architecture constraints
- after actual application scaffolding, run project analysis
- allow skill overrides
- do not force AWS or mobile skills unless requested

Registry:
`shared/presets/registry.json`
