# AI Development Office v1.0.1 — Hydration Compatibility Hotfix

Author: JeXiR (Halil Cinkilinc)

## Fix
- Added `suppressHydrationWarning` to the root `<body>` element.
- This prevents React/Next.js development warnings when a browser extension injects attributes such as `cz-shortcut-listen="true"` before hydration.
- No orchestration, runner, agent, project, Git, worktree, verifier, release, or persistence behavior changed.
- Feature freeze remains in effect.
