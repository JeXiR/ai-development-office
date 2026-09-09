---
name: baseline-validator
description: Validate a newly scaffolded project by checking framework health, dependencies, build/type/lint/tests and AI Development Kit installation.
---

# Baseline Validator

Validate the new baseline before feature work.

## Common
- dependency install succeeded
- Git status is understandable
- AI kit profile exists
- Cursor/Claude skills parity passes
- no secrets were committed

## Laravel
- PHP syntax/framework boot
- artisan command available
- tests run when baseline contains tests
- database config documented but destructive migrations are not auto-run

## Next.js
- lint if configured
- typecheck when available
- production build

## Expo
- config resolves
- TypeScript check when configured
- dependency compatibility checks when available

Report exact failing command and preserve logs useful for diagnosis.
