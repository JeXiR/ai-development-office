---
name: source-composer
description: Combine selected external components/effects with the project's own design system without producing a visually inconsistent patchwork.
---

# Source Composer

External sources are ingredients, not the design system.

## Rules

- Keep one project-owned typography system.
- Keep one project-owned spacing/radius/color token system.
- Keep interaction primitives consistent.
- Normalize imported components to current Button/Input/Card/Dialog APIs where practical.
- Do not combine multiple animation libraries on the same page without a concrete reason.
- Avoid mixing visibly incompatible visual languages.

## Composition strategy

Example:
- Radix/shadcn for accessible primitives
- existing project components for app UI
- one React Bits/Magic UI hero effect
- Motion for transitions

This is usually better than using five decorative libraries across one page.

## External code normalization

When adapting copied/registry code:
1. rename to project conventions
2. replace hard-coded colors/spacing with project tokens
3. replace primitive components with project primitives
4. remove unused variants/dependencies
5. add reduced-motion behavior
6. add responsive handling
7. add tests where behavior is meaningful
