# AI Development Office v0.13.1 — Typecheck Hotfix

Author: JeXiR (Halil Cinkilinc)

## Fixes
- Restored the missing `generateAgentAnalytics()` implementation in `kit-listener`.
- Fixed `queueWorkItems()` dependency metadata using the real queued item instead of undefined `w`.
- `queueWorkItems()` now actually runs `inferDependencies(items)` before command creation.
- Fixed nullable `agent.progressPercent` access in PixelOffice.
- Added the missing `Bookshelf` import in PixelOffice.

## Changelog organization
- Historical `CHANGELOG-v*.md` files moved under `/changelog`.
- Root `CHANGELOG.md` is now the release-note index.
