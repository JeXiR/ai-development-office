# Office Command Queue Contract v1

Author: JeXiR (Halil Cinkilinc)

Office may enqueue AI Development Kit workflow requests in:

`.ai-kit/command-requests.jsonl`

This file is project metadata, not application source code.

## Request
- request_id
- created_at
- source = ai-development-office
- project_id
- command
- status

## Important
Queue presence does not mean the command executed.

Execution states:
- queued
- waiting_for_agent
- running
- completed
- failed

A Cursor/Claude runner or explicit agent workflow must consume the request.
Never mark completed without real command telemetry.
