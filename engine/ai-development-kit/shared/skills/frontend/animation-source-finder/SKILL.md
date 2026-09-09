---
name: animation-source-finder
description: Find and adapt existing animation/effect implementations from approved web sources without polluting the project with unnecessary dependencies.
---

# Animation Source Finder

Use when an animation/effect is desired and existing project primitives are insufficient.

## Preferred decision order

1. existing project CSS/animation
2. existing installed animation library
3. Motion / equivalent project-native library
4. approved component/effect distribution
5. focused GitHub implementation
6. custom WebGL/Three.js/GSAP implementation only when justified

## Search by intent

Examples:
- reveal / enter / exit
- hover / press
- layout transition
- scroll-linked animation
- particles
- glow / spotlight
- text animation
- background effects
- weather effects
- shader effects
- marquee
- parallax
- cursor effects
- page transitions
- modal/sheet transitions

## Performance guardrails

For effects using:
- WebGL
- Three.js
- canvas
- shaders
- GSAP timelines
- high-frequency pointer listeners

check:
- low-end mobile behavior
- battery/GPU impact
- reduced motion
- visibility pausing
- cleanup/unmount behavior
- SSR/client boundaries

Decorative effects should degrade gracefully or be disabled when needed.
