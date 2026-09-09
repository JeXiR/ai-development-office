# AI Development Kit

Portable AI-assisted development environment for Cursor and Claude Code.

## Core principles
1. One shared source of truth for engineering skills.
2. Platform-specific adapters for Cursor and Claude.
3. Project documentation is first-class context.
4. Existing projects, purchased templates, and Figma may be used as references.
5. Infrastructure must remain portable across local/VPS/Docker/AWS environments.
6. Cloud providers are implementation details; business logic must not depend directly on them.
7. Prefer framework-native patterns over unnecessary abstractions.
8. Never copy legacy/template code blindly; understand and adapt it.
9. Architecture decisions should be recorded in docs/decisions.
10. Large changes require project/context analysis before implementation.

## Layout
- `shared/skills/` reusable engineering knowledge
- `shared/workflows/` cross-stack operating procedures
- `adapters/cursor/` Cursor-specific rules/skills/MCP config
- `adapters/claude/` Claude-specific skills/agents/commands
- `templates/` project starters
- `docs-template/` documentation structure copied into projects
- `scripts/` installers, sync and validation tooling

## Infrastructure portability
Applications should support a progression such as:

Local -> Docker Compose -> VPS/Plesk -> AWS

Typical AWS mappings:
- local filesystem -> S3
- local DB/MySQL/Postgres -> RDS/Aurora
- Docker containers -> ECS/Fargate
- VPS reverse proxy -> ALB/CloudFront
- cron/queue worker -> ECS scheduled tasks / Lambda / SQS workers
- local secrets/.env -> Secrets Manager / SSM Parameter Store

Do not introduce AWS-specific coupling into domain logic.


## v0.2 additions

Production-oriented skills were added for:
- Laravel / Laravel API / PHP
- authentication / authorization / queues / cache / jobs
- React / Next.js / TypeScript / Blade / Tailwind
- accessibility / responsive UI / animation / frontend performance
- MySQL / PostgreSQL / Prisma / Eloquent / migrations
- Docker / Docker Compose / Nginx / Plesk / Linux / CI/CD
- AWS IAM / RDS / ECS / EC2 / Lambda / CloudFront / Route 53 / observability

New scripts:
- `new-project.ps1`
- `sync-skills.ps1`
- `validate-kit.ps1`

Recommended flow:

```powershell
cd D:\AI-Development-Kit\scripts
.\new-project.ps1 -ProjectPath "D:\Projects\my-app"
```


## v0.3 — Design & Reference Intelligence

Added:
- design-system
- Figma-to-code
- screenshot-to-code
- component reuse
- UI architecture
- design review
- interaction design
- animation decision
- visual QA
- reference-driven development
- expanded purchased-template and legacy migration workflows
- reference registration templates
- Cursor frontend-reference rule
- Claude frontend reviewer and UI/reference commands

### Register a project reference

```powershell
cd D:\AI-Development-Kit\scripts

.\register-reference.ps1 `
  -ProjectPath "D:\Projects\finance-app" `
  -Type template `
  -Name wowdash
```

Supported reference types:
- `template`
- `legacy`
- `figma`
- `screenshot`

Then fill the generated file under:

`docs\references\`

This gives Cursor and Claude the same explicit source-of-truth about external references.


## v0.4 — Mobile Production Layer

Added production-oriented mobile skills for:
- React Native
- Expo
- mobile UI
- navigation
- secure storage
- mobile auth/API
- offline/cache
- push notifications
- deep links
- permissions
- gestures
- mobile animation
- mobile security
- mobile testing
- build/release
- App Store / Play Store
- crash reporting
- observability
- mobile QA

New workflows:
- `mobile-feature`
- `mobile-release`

New project docs:
- `docs/mobile/ARCHITECTURE.md`
- `docs/mobile/NAVIGATION.md`
- `docs/mobile/PERMISSIONS.md`
- `docs/mobile/OFFLINE.md`
- `docs/mobile/RELEASE.md`

Cursor and Claude both receive mobile-specific review behavior.


## v0.5 — Skill Router

The kit now includes `find-skill`, a task-aware skill router.

Instead of activating the entire skill library, the router:

1. reads project docs
2. detects the actual stack from repository files
3. understands the current task
4. identifies external references
5. selects the minimum relevant skill set
6. adds security/testing/architecture skills only when justified

Example:

Project stack:
Laravel + Blade + MySQL + Docker + AWS S3

Task:
`Build the invoice list page`

Router may select:
`project-context + laravel + blade + eloquent + mysql + design-system + responsive-ui + testing`

It should not select Docker or AWS skills simply because those technologies exist in the project.

Task:
`Move invoice PDF storage to S3`

Router may select:
`project-context + architecture + laravel + aws-foundations + aws-s3 + security + testing`

New files:
- `shared/skills/core/find-skill/SKILL.md`
- `shared/find-skill.md`
- `shared/skill-registry.json`
- `shared/skill-detection-rules.json`
- `shared/workflows/skill-routing/WORKFLOW.md`
- `docs-template/architecture/STACK.md`
- Cursor `skill-routing.mdc`
- Claude `find-skills` command and `skill-router` agent


## v0.6 — External Component & Effect Intelligence

Added:
- `component-source-finder`
- `animation-source-finder`
- `external-library-evaluator`
- `license-source-check`
- approved external source registry
- external component discovery workflow
- Cursor external-component rule
- Claude component scout + find-component command

Initial registered sources:
- Motion
- React Bits
- React Bits Pro
- Animate UI
- React Weather Effects
- Nordcraft (reference-oriented)

The router only uses this layer when external components/effects are relevant.
Existing project components remain the first choice.


## v0.7 — External Source Router

The kit now chooses not only *which skills* should be used, but also *which external UI/effect source category* is appropriate.

Added:
- `source-router`
- `source-composer`
- `template-source-selector`
- expanded external source registry
- source category matrix
- project-level external source policy
- source-routing workflow
- Cursor source-routing rule
- Claude source-router agent / choose-ui-source command

Initial source categories:
- core primitives
- application UI
- marketing UI
- animated UI
- advanced motion
- 3D/WebGL
- reference tools

Registered sources now include:
shadcn/ui, Radix UI, Magic UI, Aceternity UI, React Bits, Animate UI,
HyperUI, Flowbite, Tailwind Plus, Motion, GSAP, Three.js,
React Weather Effects and Nordcraft.


## v0.8 — Project Analyzer & Bootstrap Wizard

Existing projects can now be analyzed before the kit is installed:

```powershell
.\scripts\bootstrap-project.ps1 `
  -ProjectPath "D:\Projects\my-existing-app" `
  -Mode existing
```

This generates:

- `.ai-kit/project-profile.json`
- `docs/architecture/STACK.generated.md`

and installs the Cursor/Claude adapters without modifying application behavior.

For a new project:

```powershell
.\scripts\bootstrap-project.ps1 `
  -ProjectPath "D:\Projects\new-app" `
  -Mode new
```

The wizard asks for backend, frontend, database, Docker, cloud and mobile targets.

New core skills:
- `project-analyzer`
- `project-bootstrap`

New Claude:
- project-analyzer agent
- analyze-project command

New Cursor:
- project-analysis rule


## v0.9 — Selective Skill Installer & Project Sync

The kit no longer copies the full master skill library into every project.

### Install an existing project

```powershell
.\scripts\bootstrap-project.ps1 `
  -ProjectPath "D:\Projects\my-app" `
  -Mode existing
```

The analyzer creates the project profile and the installer resolves only the relevant skills.

Managed skill manifest:

`.ai-kit\installed-skills.json`

Project overrides:

`.ai-kit\skill-overrides.json`

Example:

```json
{
  "include": ["aws-s3"],
  "exclude": [],
  "pin": ["figma-to-code"]
}
```

### Synchronize after stack changes

```powershell
.\scripts\sync-project.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

The sync process:
1. re-analyzes the repository
2. resolves the desired skill set
3. adds newly relevant skills
4. removes only obsolete kit-managed skills
5. preserves unmanaged/custom skills
6. keeps Cursor and Claude skill sets aligned

Validate parity with:

```powershell
.\scripts\validate-project-skills.ps1 `
  -ProjectPath "D:\Projects\my-app"
```


# v1.0 — Presets & Project Generator

AI Development Kit now supports reusable project presets.

## Interactive wizard

```powershell
.\scripts\project-wizard.ps1 `
  -ProjectPath "D:\Projects\new-project"
```

Current presets include:

- Laravel + Blade + MySQL + Docker
- Laravel + React + PostgreSQL + Docker
- Laravel API + MySQL + Docker
- Next.js + Prisma + PostgreSQL + Docker
- Next.js SaaS + PostgreSQL + AWS
- Expo Mobile + API
- Expo Mobile + Laravel API
- Laravel + Blade + MySQL + Docker + AWS S3

## Direct preset creation

```powershell
.\scripts\create-from-preset.ps1 `
  -ProjectPath "D:\Projects\billing" `
  -Preset "laravel-blade-mysql-docker"
```

The generator creates:
- `.ai-kit/project-profile.json`
- skill overrides
- docs baseline
- Cursor rules
- Claude instructions/agents/commands
- selective skill installation
- optional Docker starter examples

After actual framework scaffolding or significant architecture change:

```powershell
.\scripts\sync-project.ps1 `
  -ProjectPath "D:\Projects\billing"
```

Presets are starting points. The analyzer remains the source of truth for the current repository state.


## v1.1 — Real Framework Scaffolding

The kit can now scaffold real Laravel, Next.js and Expo projects using native CLIs.

### Interactive

```powershell
.\scripts\project-wizard.ps1 `
  -ProjectPath "D:\Projects\new-app"
```

Choose:
1. AI baseline only
2. real framework scaffold + AI setup

### Direct real scaffold

```powershell
.\scripts\scaffold-from-preset.ps1 `
  -ProjectPath "D:\Projects\new-app" `
  -Preset "nextjs-prisma-postgres-docker"
```

The process:
1. validates prerequisites
2. runs native framework scaffolding
3. installs AI docs/adapters
4. analyzes the real repository
5. synchronizes selective Cursor/Claude skills
6. adds optional Docker example files
7. validates skill parity

Available scaffolders:
- Laravel
- Next.js
- Expo

Baseline validation:

```powershell
.\scripts\validate-baseline.ps1 `
  -ProjectPath "D:\Projects\new-app"
```

Important:
The kit intentionally keeps Docker files generated as `*.example` until reviewed.
Production Docker configuration should be adapted to the actual project rather than activated blindly.


## v1.2 — Modular Dependency & Config Capabilities

The kit can now add focused project capabilities after scaffolding.

### List capabilities

```powershell
.\scripts\list-capabilities.ps1
```

### Interactive capability wizard

```powershell
.\scripts\capability-wizard.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

### Direct install

```powershell
.\scripts\install-capability.ps1 `
  -ProjectPath "D:\Projects\my-app" `
  -Capability "motion"
```

Initial modules:
- prisma
- shadcn-ui
- motion
- laravel-sanctum
- redis
- laravel-s3
- laravel-queue-database
- laravel-cache-database
- expo-secure-store
- expo-notifications

Capability state is tracked in:

`.ai-kit\installed-capabilities.json`

Each capability updates skill overrides and runs project synchronization.

Safety principles:
- no production secrets are written
- no destructive migrations are auto-run
- existing auth/cache/queue/storage systems are not silently replaced
- dependency installation stays modular


## v1.3 — Capability Dependency Graph & Conflict Detection

Before modular capabilities are installed, the kit now checks for known conflicts.

Examples:
- Prisma vs an existing ORM
- Sanctum vs an established alternative auth system
- Motion vs existing Framer Motion/GSAP
- shadcn/ui vs another mature UI system
- duplicate Redis clients
- duplicate secure mobile storage

Conflict check:

```powershell
.\scripts\check-capability-conflicts.ps1 `
  -ProjectPath "D:\Projects\my-app" `
  -Capability "laravel-sanctum"
```

Architecture drift:

```powershell
.\scripts\check-architecture-drift.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

The full forward roadmap is in:

`ROADMAP.md`


## v1.4 — Secrets / Environment & Migration Safety

Environment audit:

```powershell
.\scripts\audit-environment.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Hard-coded secret scan:

```powershell
.\scripts\scan-secrets.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Migration safety scan:

```powershell
.\scripts\check-migration-safety.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

New environment safety:
- secret/public/private classification
- `.env.example` parity
- client exposure detection
- safe AWS secret-store guidance
- masked secret scanning

New migration safety:
- Laravel migrations
- Prisma SQL migrations
- destructive operation detection
- lock/data-loss/backward-compatibility reasoning
- expand/migrate/contract strategy
- rollback/forward-fix planning


## v1.5 — Security Audit Pipeline

Run the full project security audit:

```powershell
.\scripts\security-audit.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Included executable checks:
- secret scan
- dependency audit
- environment contract audit
- risky security configuration checks
- route exposure checks

New security skills:
- security-audit-pipeline
- authorization-auditor
- tenant-isolation-auditor
- security-route-config-auditor
- upload-security-auditor

Security docs:
- `docs/security/SECURITY_BASELINE.md`
- `docs/security/SECURITY_AUDIT.md`


## v1.6 — Test Strategy Generator

Analyze existing test infrastructure:

```powershell
.\scripts\analyze-tests.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Generate a risk-first strategy:

```powershell
.\scripts\generate-test-strategy.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Check whether a baseline test suite exists:

```powershell
.\scripts\check-test-baseline.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

New skills:
- test-strategy-generator
- test-gap-analyzer
- regression-test-planner

New docs:
- `docs/testing/TEST_STRATEGY.md`
- `docs/testing/TEST_GAPS.md`


## v1.7 — CI/CD Generator

Generate GitHub Actions:

```powershell
.\scripts\generate-cicd.ps1 `
  -ProjectPath "D:\Projects\my-app" `
  -Provider github
```

Generate GitLab CI:

```powershell
.\scripts\generate-cicd.ps1 `
  -ProjectPath "D:\Projects\my-app" `
  -Provider gitlab
```

Run local CI-style gates:

```powershell
.\scripts\ci-local-check.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

New skills:
- cicd-generator
- github-actions
- gitlab-ci
- deployment-gates

The CI layer is designed to combine:
- tests
- lint/typecheck/build
- security audit
- migration safety
- Docker build
- deployment gating


## v1.8 — Observability Bootstrap

Analyze current observability:

```powershell
.\scripts\analyze-observability.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Generate observability documentation:

```powershell
.\scripts\generate-observability-docs.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Check baseline:

```powershell
.\scripts\check-observability-baseline.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

New skills:
- observability-bootstrap
- structured-logging
- error-monitoring
- opentelemetry
- health-checks
- queue-observability
- release-observability

New optional capabilities:
- sentry-web
- sentry-expo
- opentelemetry


## v1.9 — API Contract Layer

Initialize an OpenAPI baseline:

```powershell
.\scripts\init-api-contract.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Analyze/check API contracts:

```powershell
.\scripts\check-api-contract.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Generate TypeScript types for Next/React/Expo consumers:

```powershell
.\scripts\generate-api-client.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

New skills:
- api-contract-layer
- openapi
- api-versioning
- typed-api-client
- api-breaking-change-detector
- contract-testing

New optional capability:
- openapi-typescript


# v2.0 — End-to-End Feature Generator

Initialize a feature:

```powershell
.\scripts\feature-workflow.ps1 `
  -ProjectPath "D:\Projects\my-app" `
  -Feature "Invoice Approval"
```

This creates/uses a feature spec and gathers project/test/API/observability context.

After implementation:

```powershell
.\scripts\validate-feature.ps1 `
  -ProjectPath "D:\Projects\my-app" `
  -Feature "Invoice Approval"
```

Feature validation combines:
- migration safety
- security audit
- API contract checks
- test baseline
- CI/local gates

New skills:
- feature-generator
- feature-planner
- feature-impact-analyzer
- feature-completion-gate

New Claude:
- feature-orchestrator agent
- create-feature command

New Cursor:
- feature-generator rule


## v2.1 — Multi-Tenant Architecture Pack

Analyze tenancy signals:

```powershell
.\scripts\analyze-tenancy.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Run lightweight tenant isolation checks:

```powershell
.\scripts\check-tenant-isolation.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

New skills cover:
- tenant resolution
- database isolation
- membership/authorization
- cache namespacing
- queue tenant context
- storage/S3 isolation
- cross-tenant test strategy

New docs:
- `docs/architecture/TENANCY.md`
- `docs/testing/TENANT_ISOLATION.md`


## v2.2 — AI Handoff, Project Memory & PROGRESS.md

Every project now gets a root:

`PROGRESS.md`

This is the canonical human-readable continuation state for Cursor and Claude.

It tracks:
- completed
- in progress
- todo
- bugs/errors
- technical debt
- blockers
- validation
- decisions
- next actions

Machine-readable active task:

`.ai-kit\current-task.json`

Cross-agent handoff:

`.ai-kit\HANDOFF.md`

Initialize/check:

```powershell
.\scripts\init-progress.ps1 -ProjectPath "D:\Projects\my-app"
.\scripts\check-progress.ps1 -ProjectPath "D:\Projects\my-app"
```

Set active task:

```powershell
.\scripts\set-current-task.ps1 `
  -ProjectPath "D:\Projects\my-app" `
  -Title "Invoice Approval" `
  -Milestone "Billing" `
  -Status in_progress `
  -NextAction "Implement approval policy and API endpoint."
```

Generate handoff:

```powershell
.\scripts\generate-handoff.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

New skills:
- project-memory
- ai-handoff
- progress-controller
- hallucination-guard


## v2.3 — Background Jobs Reliability Pack

Analyze queue/job architecture:

```powershell
.\scripts\analyze-background-jobs.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Review reliability heuristics:

```powershell
.\scripts\check-job-reliability.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Review scheduler overlap/distributed execution:

```powershell
.\scripts\check-scheduler-safety.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

New skills:
- background-job-reliability
- job-idempotency
- retry-backoff
- job-concurrency
- scheduler-reliability
- failed-jobs-recovery
- queue-rate-limiting
- background-job-testing

The pack assumes jobs can execute more than once and workers can fail mid-execution.


## v2.4 — File & Media Pipeline

Analyze storage/upload architecture:

```powershell
.\scripts\analyze-file-storage.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Review upload security:

```powershell
.\scripts\check-upload-security.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Review tenant-aware storage:

```powershell
.\scripts\check-storage-tenancy.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Review lifecycle documentation:

```powershell
.\scripts\check-storage-lifecycle.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

New skills:
- file-media-pipeline
- upload-security
- private-file-access
- media-processing
- image-optimization
- storage-lifecycle
- storage-metadata
- storage-abstraction
- file-media-testing

New optional capabilities:
- image-processing-node (sharp)
- aws-s3-sdk-node


## v2.5 — Infrastructure as Code

Initialize AWS Terraform/OpenTofu baseline:

```powershell
.\scripts\init-iac.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Validate IaC:

```powershell
.\scripts\validate-iac.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Create environment plan:

```powershell
.\scripts\plan-iac.ps1 `
  -ProjectPath "D:\Projects\my-app" `
  -Environment staging
```

Review generated plan text:

```powershell
.\scripts\check-iac-safety.ps1 `
  -PlanFile "D:\Projects\my-app\infrastructure\aws\plan-staging.txt"
```

New skills cover:
- Terraform/OpenTofu
- environment isolation
- ECS/Fargate
- RDS
- S3 + CloudFront
- Route53
- IAM
- IaC safety review

Production apply remains intentionally manual/gated.


## v2.6 — Production Docker Generator

Analyze runtime roles:

```powershell
.\scripts\analyze-docker-target.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Generate Docker baseline:

```powershell
.\scripts\generate-production-docker.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Run Docker safety checks:

```powershell
.\scripts\check-docker-safety.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Validate production build:

```powershell
.\scripts\validate-docker-build.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

New skills:
- production-docker-generator
- docker-multistage
- docker-nonroot
- docker-healthchecks
- docker-dev-prod
- docker-worker-scheduler
- docker-safety-review

Generated architecture is intended to remain portable to ECS/Fargate.


## v2.7 — Performance, Accessibility & Visual Regression

Initialize frontend quality controls:

```powershell
.\scripts\init-frontend-quality.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Run combined quality check:

```powershell
.\scripts\frontend-quality-check.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Individual checks:
- performance budget
- accessibility baseline
- visual regression baseline

New skills:
- performance-budget-system
- web-vitals
- bundle-budget
- accessibility-audit-automation
- keyboard-audit
- reduced-motion-audit
- visual-regression-testing
- screenshot-baseline-manager
- figma-visual-regression

New optional capabilities:
- playwright
- axe-playwright


## v2.8 — Release Manager & Documentation Sync

Prepare a release:

```powershell
.\scripts\release-workflow.ps1 `
  -ProjectPath "D:\Projects\my-app" `
  -Version "1.4.0"
```

Core durable state:
- `PROGRESS.md` — active working state
- `PROJECT_STATE.md` — durable architecture/project snapshot
- `docs/releases/<version>.md` — release-specific plan/history

Release readiness combines project progress, migrations, security, tests, CI and relevant Docker/IaC validation.

New skills:
- release-manager
- changelog-manager
- release-readiness
- rollback-planning
- documentation-sync
- project-state-sync
- adr-sync


# v3.0 — Production Ready Finalization

v3.0 focuses on stabilization rather than new features.

Run full kit diagnostics:

```powershell
.\scripts\doctor.ps1
```

Run doctor against a project integration:

```powershell
.\scripts\doctor.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

Core self-tests:
- JSON validation
- skill registry validation
- duplicate skill detection
- reference integrity
- Cursor/Claude adapter parity baseline
- version consistency

Finalization policy:
New skills should only be added when repeated real projects justify them.
Prefer improving existing skill quality and automation over growing raw skill count.


## v3.0.1 — Windows PowerShell Patch

Fixed `scripts/check-architecture-drift.ps1` boolean syntax for Windows PowerShell.

Before:
`if (Test-Path $declared -and Test-Path $generated)`

After:
`if ((Test-Path $declared) -and (Test-Path $generated))`

This bug was discovered during the first real Windows `doctor.ps1 -ProjectPath ...` integration test.


## v3.1 — Workflow Command Router

Long procedural prompts are no longer required.

In Cursor or Claude you can use:

- `continue`
- `plan next`
- `implement next`
- `fix next`
- `review`
- `validate`
- `sync project`
- `handoff`
- `release`
- `status`
- `decide`

The router reads `PROGRESS.md`, `PROJECT_STATE.md`, `.ai-kit/current-task.json`,
project docs and repository evidence, then chooses the correct workflow and skills.

See `COMMANDS.md`.


## v3.1.1 — Existing Project Update Path

Existing projects do not need to be bootstrapped again.

After replacing/updating the central AI Development Kit, run:

```powershell
.\scripts\update-project.ps1 `
  -ProjectPath "D:\Projects\my-app"
```

This refreshes Cursor/Claude adapters, re-analyzes the repository and synchronizes managed skills while preserving:

- `PROGRESS.md`
- `PROJECT_STATE.md`
- `.ai-kit/current-task.json`
- existing project docs
- project-authored `CLAUDE.md`

v3.1.1 also ensures the Workflow Command Router skills are part of the always-installed core set.


## v3.1.2 — PowerShell Self-Test Exit Code Fix

Fixed a Windows PowerShell false-negative in `scripts/self-test.ps1`.
Successful validator scripts are now evaluated using PowerShell's `$?` result instead of a stale `$LASTEXITCODE`.
The self-test now sets a deterministic final exit code.


## v3.2 — Project Audit & Self-Healing Project State

New official command:

`review project`

It performs a repository-wide read-only audit and ranks verified findings as BLOCKER/HIGH/MEDIUM/LOW/INFO.

`status` and `review project` now require project-state bootstrap/repair:
missing `PROGRESS.md`, `PROJECT_STATE.md`, `CLAUDE.md`, `CURSOR.md`, or required `.ai-kit` state is created from repository evidence before the requested workflow continues.


## v3.2.1 — Claude Workflow Router Sync Fix
Existing projects now receive a managed workflow-router block in `CLAUDE.md` without overwriting user-authored content.


## v3.2.2 — Strict Command Isolation

Fixed short-command workflow bleed:
- `status` is strictly read-only and stops after reporting state.
- `review project` no longer depends on Git and never asks to initialize a repository.
- short commands do not automatically chain into other workflows.


# v3.3 — Project Discovery & Roadmap Engine

Project state is now derived from project intent and canonical roadmap, not the other way around.

New workflows:
- discover project
- sync docs
- sync state

`status` reconstructs missing/template/stale state from docs + repository evidence.
If no meaningful project roadmap/product intent exists, the AI asks what the user wants to build and creates the canonical documentation baseline.

## AI Development Office foundation
v3.3 also introduces vendor-neutral event/state schemas for a future standalone pixel-office application.
The kit remains headless; the Office will visualize real project/agent telemetry.


## v3.3.1 — Stabilization & Contracts

Author: JeXiR (Halil Cinkilinc)

This release freezes new feature growth temporarily and hardens:
- State Contract v1
- Risk Priority Engine v1
- Audit Coverage Matrix
- Roadmap Reconciliation
- Cursor/Claude Command Parity
- Durable Handoff v2
- Behavioral Contract Fixtures

Attribution and easter eggs belong to AI Development Kit / AI Development Office only.
They must never be injected into user application source code.


## v3.3.2 — Reference Integrity Validator Fix

Author: JeXiR (Halil Cinkilinc)

Fixed a false-positive in `validate-reference-integrity.ps1`.

The old validator interpreted any manifest string containing `/` or `\` as a potential file path.
This caused descriptive metadata such as the attribution scope
`AI Development Kit / AI Development Office only; ...`
to be incorrectly reported as a missing file.

v3.3.2 validates only manifest keys that are explicitly path-bearing.
User application source code is never modified by this patch.


## v3.3.3 — Reference Integrity Validator Hardening

Author: JeXiR (Halil Cinkilinc)

The reference validator now checks a manifest value only when:
1. the key is explicitly path-bearing, and
2. the value actually looks like a path or file reference.

Identifiers such as `skill-routing` are no longer interpreted as files.
This patch affects AI Development Kit only and never injects attribution or code into user applications.


## v3.3.4 — Doctor Execution Fix

Author: JeXiR (Halil Cinkilinc)

Fixed Doctor so the v3.3.1 stabilization checks actually execute:
- Cursor/Claude command parity
- behavioral contract fixture tests

The final HEALTHY banner now reads the version dynamically from `kit.manifest.json`.

This patch affects AI Development Kit only and does not modify user application source code.


## v3.3.5 — AI Development Office Telemetry

Author: JeXiR (Halil Cinkilinc)

Added truthful headless workflow telemetry for AI Development Office.

Outputs are restricted to `.ai-kit`:
- `.ai-kit/events.jsonl`
- `.ai-kit/office-state.json`

No telemetry code or attribution is injected into user application source code.


## v3.3.6 — Project-local Office Telemetry Tools

Author: JeXiR (Halil Cinkilinc)

Fixed live Office telemetry installation.

`update-project.ps1`, bootstrap/install, and state repair now sync:
- `.ai-kit/tools/emit-office-event.ps1`
- `.ai-kit/tools/emit-office-command.ps1`

Cursor and Claude use these project-local tools instead of a machine-specific central kit path.

Telemetry remains confined to `.ai-kit` and never injects code or attribution into user application source code.


## v3.3.7 — Deterministic Cursor/Claude Telemetry Instructions

Author: JeXiR (Halil Cinkilinc)

Project-local emitters alone were not sufficient because agents did not always invoke them.

v3.3.7 synchronizes mandatory managed telemetry instructions into:
- `CURSOR.md`
- `CLAUDE.md`

Doctor validates those managed blocks in each integrated project.

Telemetry remains restricted to `.ai-kit`; user application source code is untouched.


# v3.4 — Project Readiness & Preset Composition

Author: JeXiR (Halil Cinkilinc)

AI Development Kit now checks whether it can actually scaffold a project's documented stack before starting code.

New command:
`check project readiness`

New readiness states:
- READY
- PARTIAL
- MISSING
- CONFLICT

New reusable capabilities:
- NestJS
- pnpm workspace
- Turborepo
- worker runtime
- Redis

New preset:
`fullstack-ai-mobile-monorepo`

Composition:
- pnpm workspace
- Turborepo
- Expo
- NestJS
- PostgreSQL
- Redis
- worker runtime
- Docker
- CI/CD

Scaffolding is blocked when required capabilities are missing or conflicting.


# v3.5.0 — Capability-Based Scaffold Orchestrator

Author: JeXiR (Halil Cinkilinc)

v3.5 removes framework knowledge from preset orchestration.

Canonical pipeline:

PROJECT DOCS
→ PROJECT DETECTOR
→ CAPABILITY RESOLVER
→ COMPOSITION RESOLVER
→ DEPENDENCY GRAPH
→ SKILL RESOLVER
→ SCAFFOLD ORCHESTRATOR
→ CAPABILITY VALIDATION
→ DOCTOR
→ PROJECT STATE

Named presets are now reusable capability compositions.
Ad-hoc compositions are supported without adding new mega scaffold scripts.


## AI Response Language

Project preference: `.ai-kit/settings.json`

```json
{
  "responseLanguage": "tr",
  "codeLanguage": "en",
  "commentsLanguage": "en",
  "docsLanguage": "en"
}
```

Supported values: `tr`, `en`, `de`, `ru`, `auto`.
The value may be changed at any time and applies to subsequent AI responses. Code and technical identifiers remain English.


## v3.5.3 registry fix

`response-language` is registered as a core managed skill, so `doctor.ps1` and `validate-skill-registry.ps1` recognize it correctly.

For an existing project:

```powershell
cd D:\AI-Development-Kit
Get-ChildItem "D:\AI-Development-Kit" -Recurse -File | Unblock-File
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

.\scripts\update-project.ps1 -ProjectPath "D:\path\to\project"
.\scripts\doctor.ps1 -ProjectPath "D:\path\to\project"
```

Existing `.ai-kit/settings.json` language preferences are preserved.


## Mandatory Response Language Gate

v3.5.4 resolves the actual active project before choosing the user-facing response language. This matters when an editor is opened on an old copy while the live project is elsewhere.

The authoritative preference is:

`<ACTIVE_PROJECT_ROOT>/.ai-kit/settings.json`

For Turkish:

```json
{
  "responseLanguage": "tr",
  "codeLanguage": "en",
  "commentsLanguage": "en",
  "docsLanguage": "en"
}
```

All final user-facing workflow results must be Turkish when `responseLanguage` is `tr`, while code and technical identifiers remain English.
