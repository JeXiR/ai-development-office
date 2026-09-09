# AI Development Office v0.5.1

Author: JeXiR (Halil Cinkilinc)

## Fixed
- Cursor CLI can be discovered from `%LOCALAPPDATA%\cursor-agent\agent.cmd` even when Office inherited a stale PATH.
- Native Windows `.cmd` runner execution now uses a PowerShell wrapper.
- Cursor mutating headless tasks use `--force`; read-only tasks do not.
- Runner state refreshes periodically.

## Added
- Claude Code as a real runner.
- Per-project Auto / Cursor / Claude selector.
- Cursor + Claude individual health indicators.
- `scripts/office-doctor.ps1`
- `scripts/windows-unblock.ps1`
- `scripts/setup-runners.ps1`
- Full Windows setup, login, unblock, persistence and troubleshooting README.

## Claude
Claude Code is discovered from PATH or `%USERPROFILE%\.local\bin\claude.exe`.
Non-interactive execution uses `claude -p --permission-mode auto`.
