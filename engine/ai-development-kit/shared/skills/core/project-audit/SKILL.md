---
name: project-audit
description: Perform a repository-wide evidence-based audit against project state, documentation, architecture, security, data, frontend/backend quality, tests and operations without changing code.
---

# Project Audit

Use for `review project` / `audit project`.

Read first:
- PROGRESS.md
- PROJECT_STATE.md
- CLAUDE.md when present
- CURSOR.md when present
- .ai-kit/current-task.json
- .ai-kit/project-profile.json
- relevant docs
- actual repository

Audit:
- implementation correctness
- missing/incomplete modules
- architecture drift
- duplication/dead code
- security/auth/authz
- database/migrations
- API/contracts
- frontend/responsive/accessibility
- performance
- tests
- queues/jobs/cache/storage
- environment/secrets
- Docker/deployment/CI
- technical debt
- dependency hygiene
- docs/code contradictions

Classify findings:
BLOCKER / HIGH / MEDIUM / LOW / INFO

For every finding provide evidence, affected location, impact and recommended action.

Do not fix anything during audit unless user explicitly asks.
Update project state only with verified audit findings.


## Git independence
A project audit must work without Git.
If `.git` is absent, audit the repository directly.
Never ask to initialize Git merely to perform an audit.
Do not narrow the audit to manually chosen modules unless project size forces prioritization; if prioritization is needed, choose by risk and continue with best effort.


## v3.3.1 completion requirements
A project review must:
- create/update `.ai-kit/audit-coverage.json`
- distinguish CHECKED/PARTIAL/NOT_CHECKED/NOT_APPLICABLE
- use roadmap-reconciler after verified findings
- never imply unreviewed areas passed
- never modify application code
