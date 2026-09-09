# AI Development Office v0.15.1 — Live Pixel Agents

Author: JeXiR (Halil Cinkilinc)

## Why the previous characters did not move
The detailed people visible inside the Office artwork are baked into the JPG background and therefore cannot animate.

## Fix
- Added real DOM-based pixel agent sprites above the Office artwork.
- Every live Office agent now has its own movable character.
- Idle agents have subtle continuous wandering.
- Working/planning/testing/reviewing agents use a walk/bob cycle.
- Working/testing characters animate an arm to imply typing/activity.
- Planning characters animate a speaking/gesture arm.
- Blocked/error characters use an alert shake.
- Workflow state changes still move agents between real Office zones with smooth transitions.
- Names, roles, status, task and sprint progress remain attached to the live sprite.

No new generated artwork was created for this patch.
