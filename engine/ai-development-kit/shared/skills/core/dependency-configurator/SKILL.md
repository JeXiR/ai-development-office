---
name: dependency-configurator
description: Install and configure modular project capabilities only when requested or detected, while preserving framework conventions and avoiding dependency bloat.
---

# Dependency Configurator

Use after framework scaffolding or when adding a concrete capability.

## Capability model
A capability is a focused project concern such as:
- Prisma
- shadcn/ui
- Motion
- Laravel Sanctum
- Redis
- S3 storage adapter
- queue driver
- cache driver
- Expo SecureStore

## Rules
1. inspect installed versions first
2. use framework-native install commands when available
3. install only the requested capability
4. avoid duplicate libraries
5. preserve existing configuration
6. never overwrite secrets
7. add example env keys, never production secrets
8. document material config changes
9. validate after install
10. run project sync after architecture changes

## Safety
Do not:
- run destructive migrations automatically
- replace auth systems silently
- switch cache/queue/storage drivers without explicit project intent
- expose cloud credentials
