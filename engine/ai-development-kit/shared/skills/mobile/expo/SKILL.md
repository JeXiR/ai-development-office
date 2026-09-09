---
name: expo
description: Build and operate Expo applications using Expo-native modules, EAS workflows, config discipline and production-safe native capabilities.
---

# Expo

## Defaults
- Prefer maintained Expo modules when they satisfy the requirement.
- Keep app config deterministic and environment-aware.
- Distinguish development client, preview and production builds.
- Keep secrets out of app bundles.
- Use EAS Build/Submit only through reproducible configuration.
- Record native config/plugins added to the project.
- Avoid ejecting/prebuilding permanently unless native requirements justify it.

## Before adding a package
Check:
1. Expo compatibility
2. current SDK support
3. whether equivalent Expo module already exists
4. native build implications
