# AI Development Office v0.7.0

Author: JeXiR (Halil Cinkilinc)

## Project Workbench
- Added persistent non-security work items.
- Added docs backlog harvester.
- Added frontend coverage snapshot.
- Added TODO / FIXING / LIVE EVENTS three-lane operations UI.
- Added work-item details with evidence / acceptance gaps.
- Work items can be assigned to CEO individually or by visible filter.
- Queue records work-item ID/type/title.

## Command Center
Added workflow commands:
- Harvest Docs
- Audit Frontend
- Audit Backend
- Audit Tests
- Audit Security
- Audit DevOps
- Find Next Work
- Re-check Done

Existing status/review/fix/continue/validate/readiness commands remain.

## Sources
Work is harvested from canonical/provisional project docs and then reconciled with persistent Office state. Historical TODO claims are not treated as verified completion.
