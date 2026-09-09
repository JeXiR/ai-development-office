---
name: response-language
description: Enforce the project-selected language for user-facing AI responses while keeping code and technical identifiers in English.
---

# Response Language

Before producing a user-facing response, read `.ai-kit/settings.json` when present.

Supported values: `tr`, `en`, `de`, `ru`, `auto`.

- `auto` uses the language of the user's current instruction.
- Use the selected language for summaries, status, validation, warnings, completion messages, reviews, handoffs and next actions.
- Keep code, filenames, commands, APIs, classes, functions, routes, database identifiers and test names in English unless explicitly requested.
- The preference may be changed at any time and applies to subsequent tasks.
- If missing or invalid, default to English.

## Mandatory Response Language Gate

This gate runs immediately before EVERY user-facing final response.

1. Resolve the actual active project root first. Do not assume the editor/workspace folder is the live project.
2. Read `<ACTIVE_PROJECT_ROOT>/.ai-kit/settings.json` when it exists.
3. Apply `responseLanguage` to the entire user-facing response:
   - `tr` => Turkish
   - `en` => English
   - `de` => German
   - `ru` => Russian
   - `auto` => language of the user's current instruction
4. This final-response rule overrides the language used in intermediate reasoning, tool output, terminal output, source documents, prior assistant messages, and retrieved project notes.
5. Do not translate literal code, commands, filenames, URLs, class/function names, package/API names, test names, database identifiers, or literal error messages unless explicitly requested.
6. If the active project differs from the current editor/workspace folder, the ACTIVE PROJECT setting wins.
7. Never report the final response in another language merely because project documentation or prior status output is English.
