---
name: screenshot-to-code
description: Reconstruct interfaces from screenshots while preserving project conventions and clearly separating visible facts from inferred behavior.
---

# Screenshot to Code

## Extract visible facts
- overall layout
- spacing rhythm
- typography hierarchy
- colors
- component shapes
- navigation structure
- content density
- chart/table patterns
- responsive clues if multiple screenshots exist

## Infer cautiously
Screenshots do not directly reveal:
- hover/focus states
- validation behavior
- dynamic interactions
- breakpoints
- loading/error states
- accessibility semantics

Use project conventions for missing behavior.
Ask only when the missing behavior materially changes the product.

## Implementation
Map visible UI to existing project components first.
Do not hardcode absolute positioning unless the design genuinely requires it.
