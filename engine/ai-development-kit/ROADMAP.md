# AI Development Kit Roadmap

## Completed through v1.3
- shared Cursor + Claude skill architecture
- project docs/reference model
- Laravel / React / Next / Blade / DB / mobile / Docker / AWS skills
- Figma/template/legacy/reference workflows
- external UI/effect source registry and router
- project analyzer
- selective skill installer
- project sync
- presets
- real framework scaffolding
- modular capability installer
- capability dependency/conflict detection
- architecture drift detection

## High-value next modules

### P0 — Recommended before calling the platform mature

#### 1. Secrets & Environment Manager ✅ v1.4
Purpose:
- `.env.example` generation
- secret inventory
- environment parity checks
- AWS Secrets Manager / SSM mappings
- no-secret-in-client validation

Why:
Configuration mistakes are one of the biggest production failure sources.

#### 2. Migration Safety Engine ✅ v1.4
Purpose:
- DB migration risk analysis
- table-size awareness
- destructive operation detection
- expand/migrate/contract plan generation
- rollback/readiness checklist

Why:
Database changes can cause real downtime/data loss.

#### 3. Security Audit Pipeline ✅ v1.5
Purpose:
- dependency audit
- auth/authorization review
- tenant-isolation review
- secret scanning
- dangerous route/config checks
- OWASP-oriented project checklist

Why:
Security should be executable validation, not only a skill document.

#### 4. Test Strategy Generator ✅ v1.6
Purpose:
- detect framework/testing stack
- generate test matrix
- identify untested critical flows
- baseline coverage by feature risk

Why:
The kit can install skills, but should also tell us what must be tested.

#### 5. CI/CD Generator ✅ v1.7
Purpose:
- GitHub Actions / GitLab CI presets
- Laravel/Next/Expo pipelines
- Docker build
- test/lint/typecheck
- artifact promotion
- deployment gates

Why:
Makes the development kit useful beyond local coding.

### P1 — Strong productivity improvements

#### 6. Observability Bootstrap ✅ v1.8
- logs
- metrics
- tracing
- Sentry/OpenTelemetry
- queue/job health
- release tagging

#### 7. API Contract Layer ✅ v1.9
- OpenAPI generation/validation
- API versioning policy
- typed clients
- Laravel ↔ Next/React Native contract sync

#### 8. Feature Generator ✅ v2.0
- feature docs
- backend route/controller/service
- frontend page/components
- DB migration
- tests
- permission map
- ADR when needed

#### 9. Multi-tenant Architecture Pack ✅ v2.1
- tenant scoping
- tenant DB strategies
- authorization
- queues/cache/storage tenant isolation
- tenancy test suite

#### 10. Background Jobs Reliability Pack ✅ v2.3
- idempotency
- retries
- dead-letter/failure strategy
- scheduler locks
- observability

#### 11. File & Media Pipeline ✅ v2.4
- local/S3 abstraction
- uploads
- image optimization
- signed URLs
- virus scanning hook
- lifecycle/retention

### P2 — Advanced platform features

#### 12. Infrastructure as Code ✅ v2.5
- Terraform / OpenTofu
- AWS modules
- ECS/RDS/S3/CloudFront/Route53
- environment modules

#### 13. Docker Production Generator ✅ v2.6
- optimized multi-stage Dockerfiles
- dev/prod compose
- healthchecks
- workers/scheduler
- non-root images

#### 14. Kubernetes / ECS Deployment Profiles
Only add when actual projects need them.

#### 15. Performance Budget System ✅ v2.7
- frontend bundle budgets
- API latency targets
- DB query budgets
- image budgets
- mobile startup targets

#### 16. Accessibility Audit Automation ✅ v2.7
- axe/playwright
- keyboard checks
- reduced-motion checks
- mobile accessibility checklist

#### 17. Visual Regression Testing ✅ v2.7
- Playwright screenshots
- Figma/reference comparisons
- breakpoint matrix

#### 18. Release Manager ✅ v2.8
- versioning
- changelog
- release notes
- migration checklist
- rollback checklist

#### 19. Documentation Sync ✅ v2.8
- detect stale docs
- generate architecture summary
- update PROJECT_STATE
- ADR suggestions

#### 20. AI Handoff / Session State ✅ v2.2
- Cursor ↔ Claude handoff notes
- current task state
- decisions made
- files changed
- remaining risks

### P3 — Optional, only if needed

#### 21. Monorepo Pack
- Turborepo / pnpm workspaces
- shared packages
- dependency boundaries

#### 22. Package/Library Development Pack
For reusable npm/composer libraries.

#### 23. Internationalization Pack
- locale routing
- translation keys
- Laravel/Next/mobile parity

#### 24. Payments Pack
- Stripe abstractions
- webhooks
- idempotency
- subscription state machine

#### 25. Search Pack
- Meilisearch / Elasticsearch / OpenSearch

#### 26. Realtime Pack
- WebSockets
- Laravel Reverb/Pusher
- Supabase realtime
- mobile reconnect logic

## Recommendation

Do not add all P2/P3 modules now.

Next focus should be:
1. Secrets & Environment Manager
2. Migration Safety Engine
3. Security Audit Pipeline
4. Test Strategy Generator
5. CI/CD Generator

Those five improve production safety more than adding another 50 framework skills.


# v3.0 Finalization

Core platform roadmap is considered complete for the current scope.

Future additions should be demand-driven rather than roadmap-driven.
