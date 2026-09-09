# AI Development Kit v3.5.4 — Mandatory Response Language Gate

## Fixed
- User-facing responses now apply a mandatory language gate immediately before final output.
- The gate reads `.ai-kit/settings.json` from the RESOLVED ACTIVE PROJECT, not blindly from the editor/workspace folder.
- Cursor `CURSOR.md` receives a managed response-language block in addition to the always-apply rule.
- Claude managed instructions use the same active-project language gate.
- `status` explicitly applies the language preference after all status evidence is gathered.
- Central command contracts require the gate for all major workflow commands.
- Doctor validates project response-language settings and managed instruction blocks.

## Important
If Cursor has an old/wrong folder open, open the real project root whenever possible. The v3.5.4 gate is more defensive, but the correct workspace remains the strongest source of project context.

## Attribution
Created and maintained by **JeXiR (Halil Cinkilinc)**.
