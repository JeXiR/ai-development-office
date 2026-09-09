# v2 Reproducibility — rc.2

## Deterministic task IDs
`deterministicTaskId()` hashes project, plan, role, index and title.

## State schema
Current schema version: 2.

Legacy JSON state can be wrapped into a versioned envelope with backup creation.

## Provenance
Append-only `.ai-kit/provenance/events.jsonl` records:
- execution
- artifact
- state
- git
- runtime

## Replay
Recorded provenance can be replayed deterministically in original order.

## Upgrade compatibility
Migration operations are designed to be idempotent and preserve a pre-migration backup.
