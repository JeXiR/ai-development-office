---
name: mobile-animation
description: Implement performant React Native animations with appropriate native/UI-thread execution and reduced-motion behavior.
---

# Mobile Animation

Use the existing animation stack first.

Prefer:
- simple native/layout transitions for lightweight motion
- Reanimated when complex interactive/native-thread animation is justified
- gesture-driven motion tied to direct manipulation

Avoid long blocking JS-driven animation loops.
Respect reduced-motion/accessibility settings.
Animation must not delay primary actions.
