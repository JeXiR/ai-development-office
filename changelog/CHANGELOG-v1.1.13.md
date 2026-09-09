# AI Development Office v1.1.13 — Full Office UI Localization Pass

## Added
- Broad Office UI translation coverage across Projects, Agents, Skills, Inbox, Findings, Analytics, Release, Doctor, Recovery, Retention, Settings, sidebar and top status bar.
- Static Office descriptions, labels, buttons, counters and status phrases now follow Office UI Language.
- Dynamic counter/status fragments are localized where safe.
- A MutationObserver-backed fallback translates newly rendered static Office chrome without requiring every component to duplicate localization wiring.

## Intentionally not translated
- Mission command names and command descriptions.
- Task IDs, feature-contract IDs, skill IDs, capability IDs.
- Code, file paths, commands, APIs, class/function names and literal technical content.
- Project-generated technical evidence remains intact.

## Attribution
Created and maintained by **JeXiR (Halil Cinkilinc)**.
