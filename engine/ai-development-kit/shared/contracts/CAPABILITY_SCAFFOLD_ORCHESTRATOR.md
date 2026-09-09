# Capability-Based Scaffold Orchestrator v1

Author: JeXiR (Halil Cinkilinc)

## Canonical flow

PROJECT DOCS
  -> PROJECT DETECTOR
  -> CAPABILITY RESOLVER
  -> COMPOSITION RESOLVER
  -> DEPENDENCY GRAPH
  -> SKILL RESOLVER
  -> SCAFFOLD ORCHESTRATOR
  -> CAPABILITY VALIDATION
  -> DOCTOR
  -> PROJECT STATE

## Rules

1. Presets/compositions contain capability IDs only.
2. Presets must not call framework-specific scaffolders.
3. Framework-specific behavior belongs to capability manifests.
4. The orchestrator resolves dependencies before execution.
5. Conflicts block scaffold before filesystem mutation.
6. Required capability without scaffold/validation evidence is not READY.
7. Ad-hoc compositions are allowed; a named preset is optional.
8. Project-specific hacks must not be added to the global kit.
9. Application source attribution is forbidden.

## Canonical capability IDs

Examples:

- frontend.web.nextjs
- frontend.web.react
- frontend.mobile.expo
- backend.nestjs
- backend.laravel
- database.postgres
- database.mysql
- cache.redis
- jobs.worker
- jobs.bullmq
- ai.provider-router
- infra.docker
- infra.aws
- ci.github-actions
- monorepo.pnpm
- monorepo.turborepo

Legacy aliases may resolve to these IDs but are not canonical.
