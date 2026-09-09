# AI Development Office v0.16.2 — Workstation-linked Pixel Agents

Author: JeXiR (Halil Cinkilinc)

## Workstation model
- Each known role now has one canonical workstation definition.
- The same definition renders the desk/monitor/chair and provides the agent's seat coordinate.
- This removes the previous mismatch where a desk could be in one place while its agent appeared elsewhere.

## Default behavior
- Idle agents remain seated at their own PC.
- Reading, working, testing and normal reviewing stay at the workstation.
- Active states use a typing animation.
- Idle agents use a subtle look-around animation rather than wandering around the room.

## Meetings
- Planning / CEO summon makes the character stand up and walk through corridor waypoints.
- Meeting participants use dedicated meeting positions.
- When planning/summon state ends, the target becomes the same workstation seat again and the agent walks back before sitting down.

## Character readability
- Rebuilt the DOM pixel person with a larger head, hair, face, body, shirt, arms and legs.
- Added a visible chair for seated state.
- Added role-linked PC monitor/desk/chair visuals.
- No generated image was added.
