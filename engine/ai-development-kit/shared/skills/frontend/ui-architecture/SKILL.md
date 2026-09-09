---
name: ui-architecture
description: Structure frontend pages, layouts and components with clear ownership, reuse boundaries and scalable composition.
---

# UI Architecture

Separate:
- app shell/navigation
- page layout
- domain components
- reusable UI primitives
- data/state orchestration
- presentation

Prefer:
- page-specific composition near the page
- reusable primitives in shared component libraries
- domain components grouped by feature

Avoid:
- globalizing one-off page fragments
- giant all-purpose components
- UI primitives that know business rules
- data fetching duplicated across child components without reason
