# External Component / Effect Discovery Workflow

Use when the user asks for:
- a special animation
- a visual effect
- an existing component/block
- a template enhancement
- a landing section
- a background effect
- a creative interaction

## Process

1. Read project stack/design docs.
2. Run `find-skill`.
3. Determine whether existing components can satisfy the request.
4. If not, use `component-source-finder` or `animation-source-finder`.
5. Search approved sources first.
6. Evaluate candidate using `external-library-evaluator`.
7. Check license/source using `license-source-check`.
8. Choose integration mode.
9. Adapt to the project's design system and architecture.
10. Run visual/accessibility/performance QA.
11. Register the source in project docs if reused materially.
