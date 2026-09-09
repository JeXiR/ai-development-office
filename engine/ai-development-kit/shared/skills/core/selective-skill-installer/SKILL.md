---
name: selective-skill-installer
description: Convert a project profile into the minimum installed Cursor and Claude skill set, while preserving shared source-of-truth skills and avoiding context pollution.
---

# Selective Skill Installer

## Purpose
Install only the skill families relevant to the current project and its known capabilities.

## Inputs
- `.ai-kit/project-profile.json`
- `docs/architecture/STACK.generated.md`
- `shared/skill-registry.json`
- `shared/skill-detection-rules.json`
- optional project overrides:
  - `.ai-kit/skill-overrides.json`

## Principles

1. `find-skill` remains task-aware at runtime.
2. Selective installation is project-aware at install time.
3. Installing fewer skills reduces noise but must not remove required safety/context skills.
4. Shared master skills remain in the AI Development Kit; project copies are generated artifacts.
5. Never delete project-authored custom skills unless explicitly marked as managed by this kit.

## Always-installed core
Normally install:
- find-skill
- project-context
- project-analyzer
- architecture
- coding-standards
- debugging
- security
- testing
- code-review
- git
- license-source-check

## Stack families
Install only when detected/configured.

Examples:

Laravel:
- php
- laravel
- laravel-api when API usage is detected
- eloquent
- migrations
- authentication
- authorization
- queues/caching/background-jobs only when used or configured

Next.js:
- react
- nextjs
- typescript when present
- relevant UI/design skills

Blade:
- blade
- tailwind when present

Docker:
- docker
- docker-compose when compose is present
- deployment

AWS:
Install only specific AWS skills whose services are actually targeted or documented.
`aws-foundations` may be included when AWS is a confirmed target.

Mobile:
Install React Native/Expo base plus only configured capabilities such as notifications,
deep-links, permissions, offline/cache and release.

## External UI layer
Install source-routing skills when:
- project docs allow external component/effect sources
- design/marketing work is part of the project
- approved source registry will be used

## Overrides
Allow explicit:
- `include`
- `exclude`
- `pin`

Safety/core skills should not be excluded silently.
