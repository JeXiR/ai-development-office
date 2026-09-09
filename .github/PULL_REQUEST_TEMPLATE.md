<!-- Thanks for contributing to AI Development Office.

 A PR without a BEFORE and an AFTER is hard to review. Keep the `Before`
 and `After` headings below exactly as they are. -->

## What & why

<!-- What changed, and why it needed to. Two or three sentences beats a
 list of file names. If this fixes an issue, link it: Closes #123 -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Docs
- [ ] Build / CI

## Evidence

<!-- REQUIRED for user-visible work. Attach a screenshot or a short recording
 under each heading. Same window size, same theme, same data.

 No visible UI? Record the failing behaviour and the same steps passing
 (terminal capture, log diff, typecheck/smoke going from red to green).

 Pure docs / CI / typo? Say so in "What & why". -->

### Before

<!-- The problem, as it exists on the default branch right now. -->

### After

<!-- The same view or the same steps, with your change applied. -->

## How I tested it

<!-- The actual steps you ran, on which OS. Not "tested locally". -->

- OS:
- Office version:
- Steps:

## Checklist

- [ ] Before and after evidence is attached above, or this change has no user-visible surface.
- [ ] `npm run typecheck` passes.
- [ ] This PR is **one change**. Unrelated fixes belong in their own PR.
- [ ] I read the diff myself. No debug output, commented-out code, or unrelated formatting churn.
- [ ] No `.env.local`, credentials, or machine-local project registries are included.
- [ ] File-changing provider behaviour is still behind an explicit trusted UI action.
- [ ] I did not hardcode a sample project as the Office default.
