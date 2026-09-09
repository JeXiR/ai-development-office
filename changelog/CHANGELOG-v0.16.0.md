# AI Development Office v0.16.0 — Waypoint Live Office

Author: JeXiR (Halil Cinkilinc)

## Office visual cleanup
- Replaces large always-open agent cards with compact permanent nameplates.
- Full role/task/status/progress expands only for active agents or hover.
- Repositions home desks to reduce overlap with artwork labels.
- Brightens the approved Office visual layer slightly and reduces overlay darkness.

## Real waypoint walking
- Agents now traverse named corridor waypoints instead of sliding directly through room walls.
- Upper and lower floors connect through the central elevator/corridor.
- Movement occurs waypoint-by-waypoint with walking leg/arm animation.

## Work poses
- Working/reading/testing agents sit at their home desks.
- Seated characters render a chair and typing motion.
- Idle agents stand.
- Waiting agents walk to the lounge.
- Blocked/error agents use alert motion.

## Meetings
- Planning agents walk to fixed meeting seats and line up without stacking.
- CTO/Architect review states can enter the meeting area.
- Recent CEO/CTO planning, handoff or collaboration telemetry triggers a temporary `CEO CALL` indicator and meeting route.

No new image was generated; this release changes only the running application layer.
