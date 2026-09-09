# AI Development Office v0.14.1 — Live Office & Modal UX

Author: JeXiR (Halil Cinkilinc)

## Live Office
- Agent names are now always visible on the Office visual layer.
- Status-driven room movement is enabled.
- Planning agents move to meeting positions.
- Waiting agents move to lounge positions.
- QA/Security testing states move to the quality area.
- Position changes animate smoothly instead of teleporting.
- Active agents use green glow and progress bars.

## Modal UX
- Added `ViewportModal` rendered through a React portal to `document.body`.
- Modals are now viewport-fixed and independent of page scroll position.
- Work, Findings and Coverage/Feature detail modals can open near the clicked item.
- Modal position is clamped to the visible viewport.
- Opening a modal locks body scrolling.

## Feature inventory
- Added `docs/FEATURE_STATUS-v0.14.1.md` with Implemented / Partial / Not yet implemented inventory.
