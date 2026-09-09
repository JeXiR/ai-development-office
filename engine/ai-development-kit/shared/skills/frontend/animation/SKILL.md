---
name: animation
description: Design purposeful web animations using CSS, Motion/Framer Motion, GSAP or project-native tools without harming accessibility or performance.
---

# Animation

First inspect the project's existing animation stack.

Use:
- CSS for simple transitions/state changes
- Motion/Framer Motion for React interaction/layout animation when already appropriate
- GSAP for complex timelines/scroll choreography only when justified

Animation must support hierarchy, feedback, continuity or storytelling.
Avoid animation purely as decoration when it delays interaction.
Respect reduced-motion preferences.
Do not add a new animation dependency if existing tools are sufficient.
