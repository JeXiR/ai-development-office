# AI Development Office v1.0.0 — Stable Final Release

Author: JeXiR (Halil Cinkilinc)

## Status

`STABLE` · `FEATURE FROZEN`

v1.0.0 closes the planned feature-development cycle. Future releases should be patch releases unless the feature freeze is explicitly lifted.

## Final UX
- Global `Ctrl+K` Command Palette for navigation, projects, agents, tasks and safe read-only Kit commands.
- Dedicated Decision Inbox for product decisions, dependency waits, file-ownership conflicts, merge blocks, drift and recovery decisions.
- Notification Center for verifier failures, merge blocks, competitive winners and important Office telemetry.
- Dedicated Release view.

## Final Release Center
Release Gate must pass before final Git actions are enabled.

Explicit actions:
- Create local release branch.
- Stage and create a verified release commit.
- Push current committed branch and create a GitHub PR through `gh` when available.
- Leave verified changes uncommitted by explicit user choice.

No release Git mutation is automatic. Every final action requires a direct UI action and confirmation.

## Backup / Export
Exports a non-secret Office control-plane JSON snapshot containing:
- project registry
- agent names
- provider preferences
- scheduled audits
- skill policies
- retention settings
- command history
- audit trail

Project source code and environment secrets are not copied into this backup.

## Production guarantees inherited from v0.19
- Structured Subtask Contracts
- File Ownership Gate
- Recovery Manager
- Audit Trail
- Release Gate
- Doctor v2
- Retention / cleanup

## Execution guarantees inherited from v0.18
- Solo / Collaborative / Competitive modes
- isolated Git worktrees
- coding collaborator worktrees
- candidate verification
- conflict detection
- Merge Gate
- rollback on post-merge verification failure
- Cursor-vs-Claude competitive execution with CTO selection

## Feature freeze
The stable v1 line is intended for real use, bug fixing and operational hardening rather than continued feature accumulation.
