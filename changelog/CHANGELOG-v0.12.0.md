# AI Development Office v0.12.0 — Parallel Organization & Expanded Campus

Author: JeXiR (Halil Cinkilinc)

## Parallel Role Scheduler
- Replaced the single global runner bottleneck with role-based execution lanes.
- Default maximum is 3 simultaneous runner processes.
- Configurable with `OFFICE_MAX_PARALLEL_RUNNERS`.
- Different roles/specialists can run concurrently.
- One active task per role lane prevents a single specialist from implementing multiple jobs simultaneously.
- Fail-stop is lane-scoped rather than cancelling unrelated specialist work.

## Governance
- Plan-first execution remains mandatory.
- Assigned specialist participates in planning telemetry.
- CTO and Architect planning/review occurs before CEO release.

## Real Sprint Progress
- Agent cards show completed/total for their current sprint.
- Percentage is derived from completed work items, never invented token/task progress.
- Queue count is visible.

## Expanded Pixel Campus
- Canvas expanded to 1480x930.
- Executive Suite
- Conference / Architecture
- Cloud / Ops / Knowledge
- Engineering Floor
- QA / Security Lab
- Specialist Lab
- Data Lab
- Mobile / Device Lab
- Dynamic specialists are placed into appropriate rooms based on capability.
- Planning specialists move toward executive planning before returning to their work area.
