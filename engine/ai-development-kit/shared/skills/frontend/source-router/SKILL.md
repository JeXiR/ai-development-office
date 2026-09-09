---
name: source-router
description: Select the most appropriate external UI/component/animation source based on task intent, project stack, visual style, licensing, performance and integration cost.
---

# Source Router

Use after `find-skill` when an external component, effect, animation, block or template source may materially help.

## Goal

Choose the smallest, safest and most compatible source category.
Do not default to the visually flashiest library.

## 1. Identify the need

Classify the request:

- design-system primitive
- application UI
- marketing/landing block
- animated decorative component
- advanced motion
- scroll animation
- 3D/WebGL/shader effect
- dashboard/admin component
- copy-paste Tailwind section
- premium template
- visual inspiration only

## 2. Inspect project stack

Check:
- React / Next.js / Blade / plain HTML
- Tailwind version
- shadcn/Radix/Base UI already used?
- Motion/GSAP already installed?
- SSR/client-component constraints
- accessibility requirements
- performance budget
- license/commercial constraints

## 3. Source preference matrix

### Core accessible primitives
Prefer:
- existing project primitives
- shadcn/ui
- Radix Primitives

Use for:
dialogs, menus, selects, popovers, tabs, accordions, forms and other interaction-heavy primitives.

### General Tailwind application/marketing UI
Prefer:
- HyperUI
- Flowbite
- Tailwind Plus when a valid license exists

Use for:
forms, cards, nav, dashboard patterns, marketing sections, e-commerce/application UI.

### Animated / premium visual components
Prefer:
- Magic UI
- React Bits
- Animate UI
- Aceternity UI

Use for:
heroes, animated cards, backgrounds, spotlight/glow, text effects, creative landing sections.

### Motion engine
Prefer:
- Motion when it fits existing React/web architecture
- GSAP for complex choreography, timelines, scroll-driven or advanced SVG motion

### 3D / WebGL
Prefer:
- Three.js/examples
- focused vetted GitHub sources
- specialized effect repositories such as approved weather-effects sources

Use only when the product requirement justifies GPU/runtime cost.

### Visual-builder/reference source
Use tools such as Nordcraft mainly for:
- design/interaction inspiration
- prototype/reference analysis
- exported code only when export terms and project fit are understood

## 4. Selection score

Score candidates 0–5 for:

- existing-stack compatibility
- design fit
- accessibility
- performance
- maintenance
- dependency cost
- license clarity
- integration effort
- removal/exit cost

Reject candidates with:
- unclear licensing for code reuse
- major framework mismatch
- unnecessary duplicate libraries
- poor accessibility for core product interactions
- disproportionate GPU/client cost

## 5. Output decision

Internally establish:

- selected source
- backup source
- integration mode
- dependencies added
- license state
- adaptation required
- QA requirements

Do not present a giant catalog unless the user asked for options.
