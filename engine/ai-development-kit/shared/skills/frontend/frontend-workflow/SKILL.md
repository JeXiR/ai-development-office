---
name: frontend-workflow
description: Plan and implement frontend screens and components from existing code, docs, Figma, screenshots or purchased templates.
---

# Frontend Workflow

## Before coding
- Inspect the existing design system and reusable components.
- Inspect relevant docs and project conventions.
- If Figma is provided, extract structure, typography, spacing, assets and component intent.
- If a template is referenced, inspect its patterns and dependencies before reuse.
- If an old project is referenced, understand behavior before adapting it.
- Infer routine design decisions from existing project patterns.

## Ask only material questions
Examples:
- animation intensity or interaction style when not inferable
- desktop/mobile behavior when ambiguous
- whether an interaction changes product behavior, not merely appearance

Do not ask about details that existing design tokens or components already answer.

## Implementation
1. Reuse existing components.
2. Keep responsive behavior explicit.
3. Prefer accessible native semantics.
4. Use animation only when it adds clarity or hierarchy.
5. Respect reduced-motion preferences.
6. Avoid unnecessary client-side JavaScript.
7. Perform visual, responsive, accessibility and performance review.
