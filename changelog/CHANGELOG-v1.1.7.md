# AI Development Office v1.1.7 — Queue Manager & Version UI

## Added
- Queue Manager on Tasks.
- Cancel one, selected, or all queued/waiting tasks.
- Clear stale queue against canonical backlog and superseded IDs.
- Dynamic version number from package.json in sidebar and footer.

## Safety
- Running/planning/verifying processes are never killed by queue cancellation.
- Cancelled tasks remain in history.

## Fixed
- BLOCKED > 0 now shows ATTENTION REQUIRED instead of ALL SYSTEMS GO.
