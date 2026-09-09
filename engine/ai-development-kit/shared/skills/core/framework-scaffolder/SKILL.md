---
name: framework-scaffolder
description: Scaffold Laravel, Next.js and Expo projects using their native CLIs, then hand control back to project analysis and selective skill synchronization.
---

# Framework Scaffolder

## Goal
Create the real framework baseline rather than pretending placeholder templates are full projects.

## General sequence
1. validate local prerequisites
2. validate target directory
3. select preset
4. run native framework CLI
5. install only preset-required baseline dependencies
6. add AI Development Kit docs/adapters
7. add optional Docker baseline
8. analyze actual repository
9. synchronize skills
10. run baseline validation
11. report failures without hiding them

## Laravel
Prefer Composer/Laravel-native scaffolding.

Validate:
- PHP
- Composer
- required PHP extensions where practical

Do not:
- overwrite a populated directory
- silently choose a database migration strategy
- add large starter kits unless preset requests them

## Next.js
Prefer `create-next-app`.

Default production baseline when preset requires it:
- TypeScript
- ESLint
- App Router
- src directory only if preset says so
- Tailwind only when preset says so

Do not add client state libraries by default.

## Expo
Prefer official Expo project scaffolding.

Validate:
- Node
- npm/pnpm/yarn as selected
- Expo compatibility

Do not add native modules without checking SDK compatibility.

## After scaffolding
Repository evidence becomes authoritative.
Always run analyzer/sync after native CLI generation.
