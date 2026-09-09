---
name: design-system
description: Analyze, preserve and extend an existing design system across components, pages, templates and Figma references without inventing inconsistent UI.
---

# Design System

## Goal
Maintain visual and interaction consistency while allowing deliberate extension.

## Before creating UI
Inspect:
- typography scale
- spacing scale
- radius system
- colors/tokens
- shadows/elevation
- borders
- icon set
- button variants
- form controls
- layout primitives
- cards
- tables
- dialogs/sheets
- feedback states
- dark mode strategy
- responsive behavior

## Reuse hierarchy
1. existing project component
2. existing project primitive/token
3. purchased template component already adopted by project
4. new component built from project primitives

Do not create a visually new component family when an existing system can represent the requirement.

## When extending
Document:
- why existing variants were insufficient
- new token/variant added
- where it should be reused
- whether Figma and code both need updating

## Avoid
- arbitrary spacing/radius/color values
- duplicate button/input/card families
- mixing multiple icon libraries without reason
- one-off CSS patterns that should be tokens or components
