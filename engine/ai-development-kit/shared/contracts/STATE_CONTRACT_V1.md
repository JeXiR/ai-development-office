# State Contract v1

Author: JeXiR (Halil Cinkilinc)

This contract belongs to AI Development Kit. Attribution MUST NOT be injected into user application source code.

## Canonical responsibilities

| Artifact | Responsibility |
|---|---|
| `docs/ROADMAP.md` | Product direction, phases, intended outcomes and roadmap item status |
| `PROGRESS.md` | Verified working state, findings, validation, blockers and next actions |
| `PROJECT_STATE.md` | Short durable project summary and pointers to canonical state |
| `.ai-kit/current-task.json` | Machine-readable single active task / handoff state |
| `.ai-kit/audit-coverage.json` | Machine-readable project audit coverage |
| `.ai-kit/events.jsonl` | Optional headless telemetry for AI Development Office |

## Canonical roadmap/work statuses

Only these semantic statuses are canonical:

- `VERIFIED_DONE`
- `PARTIAL`
- `TODO`
- `BLOCKED`
- `DEFERRED`
- `UNKNOWN`
- `DECISION_REQUIRED`

Do not represent absence as a checkbox item. Example:

Bad:
`- [ ] None recorded`

Good:
`No blockers recorded.`

## Evidence precedence

1. Runtime/test/build/migration/repository evidence
2. Architecture/specification contracts
3. Roadmap/TODO/product documentation
4. Existing generated state

Documentation alone cannot prove implementation completion.

## Completion rule

A task may become `VERIFIED_DONE` only when:
- required implementation exists,
- acceptance criteria are satisfied,
- relevant validation passes,
- no known blocker invalidates the result.

A failed required validation prevents `VERIFIED_DONE`.

## Reconciliation

If audit evidence contradicts roadmap state, update working state and reconcile the roadmap:
- claimed done + broken/partial implementation -> `PARTIAL`
- claimed done + insufficient evidence -> `UNKNOWN` or `PARTIAL`
- verified implementation + required validation -> `VERIFIED_DONE`

Never silently change product intent.
