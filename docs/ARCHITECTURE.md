# Architecture

## Components

AI Development Kit
  -> `.ai-kit/events.jsonl`
  -> `.ai-kit/office-state.json`
  -> Office Bridge
  -> WebSocket
  -> Next.js / PixiJS Office UI

## Boundary

The Office is read-only with respect to user application code.

Allowed writes:
- Office-local preferences
- Office-local layout
- Office-local cached telemetry
- optional `.ai-kit` telemetry emitted by the AI Development Kit itself

Forbidden:
- injecting attribution into user business code
- modifying application controllers/services/models/components
- changing project behavior merely for visualization
