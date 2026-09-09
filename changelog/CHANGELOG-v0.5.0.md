# AI Development Office v0.5.0

Author: JeXiR (Halil Cinkilinc)

## Fixed
- Project registry no longer lives in the install folder.
- ZIP upgrades can no longer overwrite added projects.
- Pixel workers now mutate real Pixi Container positions and visibly move.

## Added
- Real Cursor CLI command runner
- Sequential command execution
- Runner online/offline status
- Actionable Findings: Fix / Fix all HIGH / Fix all
- CEO sequential delegation with role assignment
- Fail-stop bulk finding queue
- Hierarchical org chart
- Renameable Office-only agent names
- Room-based office layout
- Persistent settings under LOCALAPPDATA

## Safety
- Removing a project never deletes project files.
- Bulk finding execution requires explicit UI confirmation.
- Each finding is fixed and validated separately.
