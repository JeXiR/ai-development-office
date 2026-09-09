# AI Development Office v0.5.2

Author: JeXiR (Halil Cinkilinc)

## Fixed
- Cursor headless tasks no longer fail at `Workspace Trust Required`.
- Cursor receives `--trust` only for projects explicitly trusted in Office.
- Existing untrusted queued commands remain waiting until trust is granted.

## Added
- Per-project `runnerTrusted` persistence.
- `TRUST WORKSPACE / WORKSPACE TRUSTED` UI.
- Trust confirmation shows exact local project path.
- Trust revocation.
- Workspace trust remains separate from write approval / `--force`.
