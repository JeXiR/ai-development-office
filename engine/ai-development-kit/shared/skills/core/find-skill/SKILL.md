---
name: find-skill
description: Analyze project documentation, manifests, code structure and task intent to select the minimum relevant skill set before substantial work.
---

# Find Skill

You are the skill router for this AI Development Kit.

Your job is NOT to solve the implementation task directly.
Your first job is to understand the project and determine which skills should govern the work.

## 1. Read project context

Inspect, when present:

- `docs/PROJECT_STATE.md`
- `docs/architecture/**`
- `docs/frontend/**`
- `docs/backend/**`
- `docs/database/**`
- `docs/mobile/**`
- `docs/references/**`
- `docs/decisions/**`
- `composer.json`
- `package.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- `package-lock.json`
- `vite.config.*`
- `next.config.*`
- `tsconfig.json`
- `tailwind.config.*`
- `prisma/schema.prisma`
- `docker-compose*.yml`
- `compose*.yml`
- `Dockerfile*`
- `eas.json`
- `app.json`
- `app.config.*`
- framework-specific directories

Do not assume the stack from the user's wording when repository evidence is available.

## 2. Detect architecture

Determine only what can be supported by repository evidence.

Possible dimensions:

### Core
- architecture
- coding-standards
- debugging
- security
- testing
- code-review
- git
- project-context

### Frontend
- react
- nextjs
- typescript
- blade
- tailwind
- responsive-ui
- accessibility
- frontend-performance
- animation
- animation-decision
- design-system
- figma-to-code
- screenshot-to-code
- visual-qa
- component-reuse
- ui-architecture
- interaction-design

### Backend
- laravel
- laravel-api
- php
- authentication
- authorization
- queues
- caching
- background-jobs

### Database
- mysql
- postgres
- prisma
- eloquent
- migrations
- database-performance

### Mobile
- react-native
- expo
- mobile-ui
- navigation
- mobile-storage
- mobile-auth
- mobile-api
- offline-cache
- notifications
- deep-links
- permissions
- gestures
- mobile-animation
- mobile-security
- mobile-testing
- mobile-build-release
- crash-reporting
- mobile-observability
- mobile-qa

### DevOps
- docker
- docker-compose
- nginx
- plesk
- linux
- deployment
- ci-cd

### Cloud
- aws-foundations
- aws-s3
- aws-iam
- aws-rds
- aws-ecs
- aws-ec2
- aws-lambda
- aws-cloudfront
- aws-route53
- aws-observability

## 3. Detect task intent

Project stack alone is not enough.

Examples:

"Fix this Laravel validation bug"
→ project-context, debugging, php, laravel, testing

"Build this Figma dashboard"
→ project-context, design-system, figma-to-code, component-reuse,
   relevant frontend framework, responsive-ui, accessibility, visual-qa

"Move uploads to S3"
→ project-context, architecture, relevant backend framework,
   aws-foundations, aws-s3, security, testing

"Create Docker production deployment"
→ project-context, architecture, docker, deployment,
   nginx if used, relevant cloud skill if target is known

"Add push notifications to Expo app"
→ project-context, react-native, expo, notifications,
   permissions, navigation/deep-links when relevant,
   mobile-security, mobile-testing

## 4. Select the minimum sufficient skill set

Do NOT activate every skill detected in the repository.

Select skills based on:

1. task intent
2. affected architecture
3. current stack
4. risk level
5. referenced external source
6. required validation/review

Typical target:
- small task: 3–6 skills
- medium feature: 5–10 skills
- architecture/infrastructure change: 7–12 skills

More skills are not automatically better.

## 5. Always-on safeguards

For substantial changes, normally include:

- project-context
- security when external input/auth/data/infrastructure is affected
- testing when behavior changes
- architecture when boundaries/infrastructure change

Do not include these mechanically for trivial formatting or copy edits.

## 6. Reference detection

If the user or docs reference:

- Figma → include `figma-to-code`
- screenshot → include `screenshot-to-code`
- purchased template → use purchased-template workflow
- old/legacy project → use legacy-to-new workflow
- docs/reference source → use reference-driven-development workflow

## 7. Conflict resolution

When project evidence conflicts with documentation:

1. do not silently choose
2. inspect modification recency if available
3. prefer executable repository reality for current implementation
4. treat docs as intended architecture
5. flag meaningful drift before architecture-sensitive changes

## 8. Output before implementation

Internally establish:

- detected stack
- affected modules
- selected skills
- relevant workflows
- relevant docs/references
- major uncertainties

Do not burden the user with a long skill inventory unless it helps the task.

After selection, continue using the selected skills as the governing context.


## 9. External component/effect routing

When the task explicitly seeks or would materially benefit from an external visual component/effect:

- include `component-source-finder`
- include `animation-source-finder` for motion/effects
- include `external-library-evaluator` before adding a dependency
- include `license-source-check` before copying/reusing external code

Use `shared/external-sources/registry.json` as the preferred source registry.

Do not activate these for ordinary UI work when existing project components are sufficient.


## 10. Source routing

When external UI/component/effect discovery is justified:

1. include `source-router`
2. use `shared/external-sources/registry.json`
3. include `source-composer` when external code will be integrated
4. include `template-source-selector` when choosing between full templates, blocks and components
5. prefer project-owned foundational UI over decorative libraries


## 11. Generated project profile

If `.ai-kit/project-profile.json` exists:
- use it as a fast architecture hint
- verify task-critical facts against repository evidence
- re-run project analysis when profile is stale or architecture materially changed

If `docs/architecture/STACK.generated.md` conflicts with executable repository reality,
prefer repository reality and flag drift.


## 12. Selective project installation

If `.ai-kit/installed-skills.json` exists:
- treat it as the project-level available managed skill set
- select task skills from installed skills first
- if a required skill is missing because the architecture changed, invoke/recommend project sync
- never substitute an unrelated installed skill merely because the correct one is absent


## 13. Preset-aware projects

If the project profile contains a preset:
- treat it as initial architecture intent only
- verify current repository evidence
- use actual detected stack for task routing when it differs
