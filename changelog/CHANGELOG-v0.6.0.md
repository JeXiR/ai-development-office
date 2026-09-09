# AI Development Office v0.6.0

Author: JeXiR (Halil Cinkilinc)

## Critical fixes
- Kit listener now uses the same persistent project registry as the bridge.
- Removed split-brain `office.projects.json` vs `%LOCALAPPDATA%` behavior.
- Running commands are recovered after Office restart instead of being orphaned.
- Queue execution uses persistent explicit sequence numbers.

## Persistence
- Agent names persist per project.
- Fix-all queue groups and order persist.
- Finding history persists in `.ai-kit/office-findings.json`.

## Findings
- OPEN / FIXED / ALL tabs.
- Fixed findings remain visible with strike-through.
- Click any finding for detail/history.
- Working findings show assigned role.
- Retry failed/cancelled commands.

## UI
- New Mission Control layout inspired by pixel-office dashboards without copying third-party assets.
- Team Overview sidebar.
- Room-based central office.
- CEO Mission Queue sidebar.
- Professional Findings Workbench.
