# AI Development Office v0.13.2 — Zustand Snapshot Hotfix

Author: JeXiR (Halil Cinkilinc)

## Fix
- Fixed `getServerSnapshot should be cached` warning in `PixelOffice`.
- Removed selector fallback that allocated a new `{}` object on every snapshot.
- `PixelOffice` now selects the stable `agentNames` store object and derives project names with `useMemo`.
- Added a stable `EMPTY_AGENT_NAMES` constant.

## Regression guard
- Source scan confirms no remaining `useOfficeStore(... || {})` selector pattern in TSX files.
