---
name: navigation
description: Design predictable mobile navigation using Expo Router or React Navigation with deep links, auth gates and state restoration.
---

# Mobile Navigation

Define:
- root navigation structure
- authenticated vs unauthenticated routes
- tabs/stacks/drawers
- modal routes
- deep-link mapping
- back behavior
- restore behavior after process death/relaunch
- not-found/error fallback

Avoid embedding authorization decisions only in UI navigation.
Navigation guards must not replace server-side authorization.
