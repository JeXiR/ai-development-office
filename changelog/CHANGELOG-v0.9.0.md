# AI Development Office v0.9.0 — Professional Living Office

Author: JeXiR (Halil Cinkilinc)

## UI stabilization
- Introduced readable typography scale.
- Increased Team Presence card readability.
- Tasks now clamp to two lines instead of leaking across the row.
- Operations area is explicitly three lanes: TODO / FIXING / LIVE EVENTS.
- Live event text is larger and wraps safely.
- Command Center gains workflow presets.

## Original sprite animation foundation
- Added original pixel sprite assets created specifically for AI Development Office.
- Added canonical sprite atlas plus runtime frame assets.
- Added animation architecture under `src/office-animation`.
- Supported states: idle, directional walking, sit, typing, planning, reviewing, testing, meeting, waiting, blocked, error, celebrate.

## Movement
- Added deterministic room waypoint routing.
- Agents route through hallways/room entries instead of interpolating directly through walls.
- Movement animation direction follows route direction.
- Arrival changes to telemetry-derived activity animation.

## Bubble behavior
- Task bubbles use readable two-line wrapping and auto-hide after a short interval.
- Full task remains available in Team/Agent details.

## Principles
- No third-party pixel assets copied.
- No fake active telemetry.
- Idle/presence animation is allowed without implying work.
