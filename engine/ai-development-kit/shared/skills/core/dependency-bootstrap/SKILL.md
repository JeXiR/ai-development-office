---
name: dependency-bootstrap
description: Install only the initial dependencies required by the selected preset and existing architecture, avoiding speculative packages.
---

# Dependency Bootstrap

## Rules
- use the project's package manager
- prefer framework-native capabilities
- avoid duplicate UI/animation/state libraries
- install only dependencies required by the chosen preset
- distinguish dev dependencies from runtime dependencies
- never add packages merely because they are popular
- record material dependency decisions in docs when architectural

## Typical examples
Next + Prisma:
- prisma
- @prisma/client

Laravel AWS S3:
- use Laravel filesystem integration and required adapter only when S3 is actually enabled

Expo:
- use Expo-compatible install commands for Expo-managed native packages
