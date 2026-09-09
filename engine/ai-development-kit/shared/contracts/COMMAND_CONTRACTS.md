# Command Contracts

Cursor and Claude adapters must preserve the same semantics.

## status
Read-only application-wise. Reconstruct state only when missing/template/stale. Report and stop.

## sync state
Discover canonical docs/roadmap and reconstruct project state from evidence.

## review project
Deep read-only implementation audit. Git is optional. Produce coverage matrix and findings. Reconcile state/roadmap.

## fix next
Select by risk policy. Re-verify evidence, make minimum safe fix, add/run relevant validation, update state. Never mark verified done after required validation failure.

## validate
Run applicable validation gates and persist results.

## continue
Resume `.ai-kit/current-task.json` from `next_step`; do not restart completed phases without evidence that state is invalid.

## decide
Resolve only decisions supported by project constraints; ask user for material product/business choices.

## handoff
Persist machine-readable phase, last completed step, next step, evidence, findings and validation state.

## discover project
Discover project intent and canonical documentation.

## sync docs
Normalize/reconcile docs without deep application audit.


## Response Language Contract

Every user-facing command result (`status`, `continue`, `next`, `plan next`, `implement next`, `fix next`, `review`, `review project`, `validate`, `sync project`, `sync docs`, `sync state`, `discover project`, `handoff`, `release`, `decide`, `check project readiness`, `resolve capabilities`, `scaffold project`, `project coverage`) MUST apply the Mandatory Response Language Gate after resolving the active project and before emitting the final response.

The resolved active project's `.ai-kit/settings.json` is authoritative even when the editor/workspace folder is different.
