# AI Development Office v2.1.0 — Stable

## Product architecture

AI Development Office v2.1.0 unifies:

- embedded AI Development Kit
- project discovery and docs intelligence
- docs-driven mission queue
- manual Mission Runner
- autonomous provider orchestration
- account/API/local provider foundations
- real project file/command/test/Git execution
- evidence and replay
- approval/safety foundations
- Pixel Office V2
- one-click desktop runtime
- backup/recovery/upgrade tooling
- release acceptance and integrity gates

## Project workflow

```text
Project folder / user brief
→ Development Kit docs
→ ROADMAP / PROGRESS / PROJECT_STATE
→ Mission Queue
→ Mission Runner
→ Agents / Providers
→ Project execution
→ Tests / Git diff / Evidence
→ PROGRESS / PROJECT_STATE sync
→ Next Mission
```

## Stable artifact status

This artifact is versioned as `v2.1.0 Stable`.

However, the real Windows/CallMe final acceptance evidence has not been executed inside the artifact-building environment.

Therefore:

- Stable package: created
- internal syntax/static integrity: validated
- real Windows typecheck/build/gates: pending
- real CallMe validation: pending
- npm audit review: pending
- manual security review: pending

The release manifest intentionally preserves this validation state instead of claiming evidence that does not exist.

## Final local verification

Run:

```powershell
.\scripts\run-final-acceptance.ps1
```

and then:

```bash
npm run stable:verify
```
