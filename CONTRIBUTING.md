# Contributing

Thanks for helping with AI Development Office.

This repository is a local mission-control product. Keep changes small, reviewable, and honest about what they do to a user's machine.

## Before you start

1. Read the product surface in [README.md](README.md).
2. Skim [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) so UI / bridge / kit boundaries stay intact.
3. Use [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for a working local Office.

## Local checks

```powershell
npm install
npm run typecheck
```

`npm run typecheck` is the minimum bar for every PR. Targeted smoke scripts under `scripts/` are welcome when you touch that area. Do not treat `npm run full-regression` as something reviewers must run on every change.

## Pull requests

Use the pull-request template. A reviewable PR:

- does **one** thing
- explains **why**, not a list of file names
- includes **before / after** evidence for anything a user can see
- does not mix formatting churn with a behavior change
- does not commit `.env.local`, credentials, AppData registries, or real project paths that belong only on your machine

Link an issue when one exists (`Closes #123`).

## Boundaries that must stay true

- The Office UI is read-only against user application code.
- File-changing provider runs stay behind explicit trusted actions. Do not add silent `--force` or permission bypass.
- Do not inject Office attribution into a user's business code.
- Do not hardcode a sample project (including CallMe or SimpleTodo) as the default Office project.
- Keep user-facing copy translatable. UI languages are English, Turkish, German, and Russian.
- Backend command strings, CallMe titles, governance IDs, Doctor details, provider IDs, and product names stay untranslated.

## Issues

- Bugs: use the bug report form. Include OS, Office version (`package.json`), and the exact steps.
- Features: use the feature request form. Describe the user-visible outcome, not a file list.
- Security: do **not** open a public issue. Follow [SECURITY.md](SECURITY.md).

## Git

Do not update git config, skip hooks, or force-push shared branches unless a maintainer explicitly asks.
