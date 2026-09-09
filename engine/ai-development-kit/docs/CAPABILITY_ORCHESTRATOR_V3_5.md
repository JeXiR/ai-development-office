# AI Development Kit v3.5 Architecture

## Main principle

Projects are not scaffolded from hard-coded technology presets.
Projects are scaffolded from a resolved graph of reusable capabilities.

## Example

`fullstack-ai-mobile-monorepo`

is only:

- monorepo.pnpm
- monorepo.turborepo
- frontend.mobile.expo
- backend.nestjs
- database.postgres
- cache.redis
- jobs.worker
- ai.provider-router
- infra.docker
- ci.github-actions

The generic orchestrator decides execution order from dependencies.

## Ad-hoc example

A project requiring:

- frontend.web.nextjs
- orm.prisma
- database.postgres

does not need a new script or special preset.
The same orchestrator runs that composition.
