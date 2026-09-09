# AI Development Office v0.13.0 — Mission Control Expansion

Author: JeXiR (Halil Cinkilinc)

## Multi-floor Office
- Replaces the 1480px horizontal campus with a fixed 1080x960 office.
- No horizontal canvas scrolling.
- Floors: Executive, Engineering, Data/Mobile, Ops/Quality.
- Floor tabs show agent and active counts.
- Rooms use compact adaptive grids.

## Dependency Graph Scheduler
- Parallel scheduler now respects work-item dependencies.
- Explicit dependency IDs supported.
- Conservative same-sprint inference connects matching frontend/backend/test/security work.
- Dependency graph persists under `.ai-kit/office-dependency-graph.json`.
- Dependency-blocked work is visible instead of silently waiting.

## Decision Center
- Centralizes unanswered feature-contract questions.
- Shows dependency-blocked work in one place.

## Quality Gates
- Runner success is not treated as resolved work.
- Mutating work remains `pending_reaudit` until current evidence removes the source gap.

## Task Reports
- Every executed task writes a durable JSON report under `.ai-kit/task-reports/`.

## Agent Utilization
- Adds assigned/completed/failed/queued/success-rate/average-duration metrics.
- Tracks historical peak parallel execution.
- Persists `.ai-kit/office-agent-analytics.json`.
