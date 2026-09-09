# AI Development Office v2.0.0-beta.3.3 — Browser Bundle Hotfix

## Fixed
- Removed browser-incompatible `node:crypto` from `src/pixel-office/reducer.ts`.
- Added browser-safe ID generation using `globalThis.crypto.randomUUID()` with a fallback.
- Added validation that traces client-facing local imports and rejects `node:*` builtins leaking into the client bundle.

## Attribution
Created and maintained by **JeXiR (Halil Cinkilinc)**.
