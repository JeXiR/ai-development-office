# Purchased Template Workflow

## Step 1 — Register reference
Create `docs/references/<template>.md` including:
- path/repository
- vendor/template name
- framework/version
- license notes
- useful sections/components
- known constraints

## Step 2 — Analyze before reuse
Inspect:
- package dependencies
- architecture
- component library
- styling method
- assets
- charts
- navigation
- responsive behavior
- build/runtime assumptions

## Step 3 — Decide reuse mode
A. visual reference only
B. selected component reuse
C. layout reuse
D. starter/base template

Do not silently switch between modes.

## Step 4 — Integrate
- preserve current project architecture
- avoid duplicate libraries
- upgrade stale patterns instead of copying them
- reuse code only within license constraints
- adapt tokens/components to current design system

## Step 5 — QA
- functionality
- responsiveness
- accessibility
- visual consistency
- dependency/security impact
