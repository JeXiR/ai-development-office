# AI Development Office v0.6.1

Author: JeXiR (Halil Cinkilinc)

## Fixed
- Fixed React 19 / Zustand warning:
  `The result of getServerSnapshot should be cached to avoid an infinite loop`
- `OfficeDashboard` no longer performs `filter().sort()` inside a Zustand selector.
- Added stable `useActiveProjectQueue()` hook using raw store references + `useMemo`.
- Queue order remains `queueSequence` first, `createdAt` second.

## Why
A Zustand selector must return a stable snapshot when store state has not changed.
Creating a new array inside the selector causes React 19 to treat every render as a state change.
