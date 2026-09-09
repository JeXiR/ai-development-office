---
name: office-telemetry
description: Emit AI Development Kit workflow telemetry into .ai-kit/events.jsonl for the standalone AI Development Office without modifying user application code.
---

# Office Telemetry

Author: JeXiR (Halil Cinkilinc)

Telemetry is optional and headless-safe.

Write events only to:
- `.ai-kit/events.jsonl`
- `.ai-kit/office-state.json`

Never inject Office telemetry into user application source code.

## Emit at workflow boundaries

For short commands:
- command start
- meaningful phase/task start
- finding/decision/validation events when verified
- command completion or error

Use `scripts/emit-office-event.ps1`.

## Role mapping

- orchestration / command routing -> CEO
- roadmap/state -> PM / Docs
- architecture -> Architect
- backend -> Backend
- frontend -> Frontend
- database/migrations -> Database
- tests -> QA
- security -> Security
- CI/deploy/ops -> DevOps

Telemetry must reflect real workflow state. Do not emit fake progress.


## Project-local tool contract

The update/bootstrap flow installs emitters into:

`.ai-kit/tools/`

Agents should invoke those local tools so Cursor and Claude behave consistently across machines and projects.
