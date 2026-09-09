# AI Development Office v0.14.0 — Pixel Mission Control UI

Author: JeXiR (Halil Cinkilinc)

## Visual layer
- Replaces the old all-panels-on-one-page experience with a mission-control shell.
- Left navigation: Office, Agents, Tasks, Findings, Analytics, Memory, Settings.
- Uses the approved pixel-office artwork as the Office visual layer.
- Real agent telemetry is overlaid on the visual campus.
- Active agents, queue, findings, blocked work and parallel execution are shown as numeric KPIs.
- Added Agent Squad strip with current status and sprint percentage.

## Operations
- Added evidence-based Agent Trust Score.
- Added Scheduled Audits for read-only `status`, `review project`, and `project coverage`.
- Added Quality Gate dashboard.
- Task execution reports are now actually written by the runner flow and inspectable from the UI.
- Added token/cost telemetry foundation. Current CLI data is recorded as unavailable rather than fabricated.

## Existing systems preserved
- Parallel role scheduler
- Capability-driven dynamic specialists
- Dependency graph scheduler
- Plan-first workflow
- CEO / CTO / Architect governance
- Coverage, Findings, Decision Center, Workbench
