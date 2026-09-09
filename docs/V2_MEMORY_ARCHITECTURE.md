# v2 Memory Architecture — alpha.4

## Durable storage

`.ai-kit/memory/state.json`

Scopes:
- shared
- per-agent

Kinds:
- lesson
- decision
- fact
- warning
- handoff
- summary
- history

## Search

alpha.4 includes deterministic semantic-ish retrieval:
- tokenized query terms
- title/body/tag matching
- importance weighting
- access-frequency weighting

This does not require an external embedding service. A vector backend can be added later without changing the API.

## Retention

- importance-aware pruning
- high-importance memories survive retention
- condensation produces summary memories
- temp-file + rename persistence

## Director integration

Before planning a goal, the Director retrieves related project memory and posts the recalled context into the collaboration blackboard.

## Bridge actions

- `memory_snapshot`
- `memory_add`
- `memory_search`
- `memory_condense`
