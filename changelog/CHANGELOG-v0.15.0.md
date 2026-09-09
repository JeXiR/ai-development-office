# AI Development Office v0.15.0 — Multi-Project & Verification

Author: JeXiR (Halil Cinkilinc)

## Multi-project management
- Fixes the v0.14 UI regression that visually hid every inactive project.
- Top bar now uses a compact project dropdown and shows the registered project count.
- New `Projects` navigation view.
- Register unlimited project paths.
- Every project card exposes active selection, provider, workspace trust and safe registry removal.
- Removing a project from Office never deletes project files.

## Independent verifier
- Mutating work now starts a fresh read-only verifier process after executor success.
- When possible, the verifier uses the alternate provider (Cursor executor -> Claude verifier, or vice versa).
- If only one provider exists, a separate fresh read-only process is still used.
- Downstream dependency work is blocked unless the independent verifier passes.
- Verification reports persist under `.ai-kit/office-verifications/`.

## Drift detection
- Verifier compares current repository evidence against the approved implementation plan.
- Explicit `DRIFT: YES/NO` contract.
- Scope drift or failed verification blocks completion and quality-gate release.

## Collaborative ownership
- Commands now have `leadRole` and `collaboratorRoles`.
- Implementation work conservatively assigns QA collaboration by default.
- Collaboration is visible in task detail and emitted into live Office telemetry.
