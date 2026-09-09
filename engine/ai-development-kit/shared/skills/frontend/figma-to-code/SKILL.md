---
name: figma-to-code
description: Convert Figma designs into production code by mapping design structure to the project's existing components, tokens and architecture rather than reproducing pixels blindly.
---

# Figma to Code

## Required sequence
1. Inspect project architecture and design system.
2. Inspect relevant Figma frame(s), component names, variables and assets when available.
3. Map Figma elements to existing code components.
4. Identify missing components/tokens.
5. Infer responsive behavior from neighboring frames and project conventions.
6. Ask only unresolved product/design questions that materially affect behavior.
7. Implement using project-native components.
8. Compare visually.
9. Run responsive/accessibility/performance review.

## Mapping rules
Prefer:
Figma Button -> existing Button component
Figma Input -> existing Input/FormField component
Figma Modal -> existing Dialog/Modal primitive
Figma card -> existing Card primitive
Figma color/spacing -> existing design token

Do not generate duplicate primitives merely because Figma names differ.

## Assets
- reuse exported source assets when available
- preserve aspect ratio
- avoid embedding huge inline assets unnecessarily
- optimize images appropriately
- do not approximate logos/brand artwork with CSS

## Responsive inference
Use:
- supplied mobile/tablet frames
- constraints/autolayout
- current project's responsive conventions
- content behavior

Do not simply scale desktop layouts down.
