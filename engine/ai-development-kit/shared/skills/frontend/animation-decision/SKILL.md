---
name: animation-decision
description: Decide whether and how to animate an interface based on purpose, project stack, performance and accessibility.
---

# Animation Decision

## Ask these questions internally
1. What user understanding does motion improve?
2. Is there already an animation library in the project?
3. Can CSS solve it cleanly?
4. Is layout animation needed?
5. Is scroll choreography truly justified?
6. How should reduced motion behave?

## Default selection
- CSS: simple hover/focus/reveal/state transitions
- Motion/Framer Motion: React presence/layout/gesture interactions
- GSAP: complex sequences/scroll-driven choreography only when necessary

## Intensity
If the project/user has not defined animation style:
- infer from existing product
- use restrained motion by default
- ask only when animation is a major visual/product decision
