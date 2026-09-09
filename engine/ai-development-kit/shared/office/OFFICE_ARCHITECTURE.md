# AI Development Office

The Office is a separate visualization application, not a runtime dependency of the AI Development Kit.

## Principles
- AI Development Kit remains headless.
- Office consumes state/events.
- Closing Office never stops Cursor/Claude workflows.
- UI is telemetry-driven, not decorative simulation.

## Conceptual roles
- CEO / Project Orchestrator
- Project Manager / Roadmap
- Architect
- Backend
- Frontend
- Database
- QA
- Security
- DevOps
- Documentation

## Agent states
- idle
- reading
- planning
- working
- reviewing
- testing
- waiting
- blocked
- done
- error

## Suggested future app
AI-Development-Office/
- Next.js
- PixiJS or similar 2D engine
- WebSocket/event stream
- project dashboard
- pixel office
- task board
- roadmap board
- findings board
- agent/session monitor

The Office reads standardized contracts from `shared/office/contracts`.
