# AI Development Office v0.17.0 — Collaboration & Portfolio Control

Author: JeXiR (Halil Cinkilinc)

## Collaborator Execution v2
- Collaborators are now real separate runner processes instead of metadata-only labels.
- Collaborator work is deliberately read-only before lead execution to avoid uncontrolled concurrent writes to the same repository.
- Up to three collaborator reviews run in parallel after the approved plan is ready.
- Each collaborator must return `REVIEW: PASS/BLOCK` and `BLOCKER: NO/YES`.
- A collaborator blocker prevents lead mutation from starting.
- Lead execution receives the collaborator reports as context.
- Reports persist under `.ai-kit/office-collaboration/`.
- Office telemetry emits collaborator review, approval and block events.

## Skills Hub
- New Skills navigation view.
- Discovers `SKILL.md` files under `.cursor/skills` and `.claude/skills`.
- Merges Cursor/Claude parity into one registry.
- Adds active Kit skills/capabilities exposed by the project's live agents.
- Shows skill category, source, active agents, capabilities and source paths.

## Multi-Project Overview
- Projects page now starts with a portfolio dashboard.
- Shows all registered projects with health, active agents, queue, ready work, findings, blocked work and completed work.
- Projects can be opened directly from the overview.
- Existing project registry/provider/trust controls remain below it.

## Dependency Graph UI
- New task dependency graph based on real command history and dependency IDs.
- Displays execution levels, edges, lead role, task status and quality gate state.
- Cycles are guarded in the UI level calculation instead of hanging the renderer.

## Quality Gate v2
- Quality workflow is now displayed explicitly as:
  `Plan -> Collaborators -> Lead -> Verifier -> Re-audit`.
- Each stage has done/active/failed/waiting/not-applicable status.
- Task reports show collaborator summary, verifier state, drift and final gate.

## Workstation behavior
- Existing v0.16.2 workstation/seat routing remains the source of truth.
- Collaboration/handoff telemetry continues to drive meeting movement without changing workstation coordinates.
