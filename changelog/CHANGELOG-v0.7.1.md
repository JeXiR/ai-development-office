# AI Development Office v0.7.1

Author: JeXiR (Halil Cinkilinc)

## Fixed
- Added missing `workItemId`, `workItemTitle`, and `workItemType` to the frontend `OfficeCommandRequest` contract.
- Added `execute work item` to the command name union.
- Kept queue metadata (`queueGroupId`, `queueSequence`, `attempt`) synchronized with the bridge command model.
- Added a static contract scan so work-item command fields used in UI are checked against the TypeScript interface.

## Error fixed
`TS2339: Property 'workItemId' / 'workItemTitle' does not exist on type 'OfficeCommandRequest'.`
