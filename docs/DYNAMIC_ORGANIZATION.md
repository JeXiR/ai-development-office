# Dynamic Organization

AI Development Office has two staffing layers.

## Core team

Always present:

- CEO
- CTO
- PM
- Architect
- Docs
- DevOps
- QA
- Security

## Capability specialists

Generated from active project evidence such as:

- `.ai-kit/project-readiness.json`
- `.ai-kit/project-profile.json`
- resolved capability artifacts
- `docs/architecture/STACK.generated.md`
- package/composer/pubspec manifests
- repository evidence

Examples:

- `frontend.web.nextjs` -> Next.js Specialist
- `backend.laravel` -> Laravel Specialist
- `backend.nestjs` -> NestJS Specialist
- active Flutter -> Flutter Specialist
- `database.mysql` -> MySQL Specialist
- `database.postgres` -> Postgres Specialist
- `cache.redis` -> Redis Specialist
- `infra.aws` -> AWS Specialist
- AI provider evidence -> AI Specialist

A docs folder name alone is weak evidence. If a technology looks future-only or ambiguous,
the resolver should keep it candidate-only rather than pretending it is active.

Generated organization:

```text
<project>/.ai-kit/office-organization.json
```

## Governance

```text
CEO
└─ CTO
   ├─ PM
   ├─ Architect
   ├─ Core verification/ops roles
   └─ Capability specialists
```

Architect creates implementation plans. CTO provides technical-governance review.
CEO releases approved work to the appropriate specialist.
