---
name: cicd-generator
description: Generate stack-aware CI/CD pipelines for Laravel, Next.js, Expo and Docker with validation, security, migration and deployment gates.
---

# CI/CD Generator

## Goal
Create reproducible pipelines that validate the project before deployment.

## Detect
- GitHub Actions / GitLab CI
- package manager
- PHP/Node versions
- Laravel/Next/Expo
- Docker
- test/lint/typecheck/build scripts
- migration presence
- security audit scripts
- deployment target

## Pipeline stages
1. checkout
2. runtime setup
3. dependency install
4. cache
5. lint / format check
6. typecheck
7. tests
8. security audit
9. migration safety check
10. production build
11. container build when applicable
12. artifact publication
13. deployment gate
14. deploy
15. post-deploy smoke check

## Rules
- fail fast on correctness/security failures
- do not expose secrets in logs
- use least-privilege CI credentials
- build once and promote the same artifact when practical
- never auto-run destructive migrations
- require explicit production deployment intent
