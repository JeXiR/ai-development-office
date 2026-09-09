# AI Development Kit v3.5.5 — Telemetry ProjectPath Fix

## Fixed
- `emit-office-command.ps1` now accepts an omitted `-ProjectPath` and falls back to the current working directory.
- Cursor/Claude telemetry instructions explicitly pass the active project path.
- Prevents `MissingMandatoryParameter` noise during commands such as `status`.

## Preserved
- Mandatory response-language gate.
- `responseLanguage: tr/en/de/ru/auto`.
- Cursor/Claude managed language blocks.
- Registry validation.
- JeXiR (Halil Cinkilinc) attribution.
