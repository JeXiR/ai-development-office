# AI Development Office v0.11.0 — Dynamic Organization

Author: JeXiR (Halil Cinkilinc)

## Core team
- Added CTO.
- Core organization is now CEO, CTO, PM, Architect, Docs, DevOps, QA, Security.
- Backend/Frontend/Database are no longer assumed to exist in every project.

## Capability specialists
- Added capability-driven specialist resolution.
- Specialists are derived from active project stack/capability/repository evidence.
- Supports Next.js, Laravel, NestJS, Flutter, Expo, React Native, MySQL, Postgres,
  Redis, Worker/Queue, AI, AWS, Docker, Observability, Billing and API specialists.
- Generic Backend/Frontend agents are suppressed when a stronger framework-specific specialist exists.

## Scope safety
- Weak docs-folder evidence does not automatically activate future technologies.
- Flutter, for example, requires active-scope evidence such as pubspec or resolved active capability.
- Ambiguous technology may remain candidate instead of becoming a fake worker.

## UI
- Team Presence split into Core Team and Specialists.
- Specialist cards show capability provenance.
- Added Organization Resolver status panel.
- Pixi office renders dynamic specialist agents instead of a fixed ten-person roster.

## Governance
- Plan flow now emits CTO technical review before CEO release.
- Work-item telemetry targets the assigned specialist role.
