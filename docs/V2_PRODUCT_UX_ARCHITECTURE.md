# v2 Product UX — beta.3

Native i18n replaces the prior DOM MutationObserver translation fallback. Navigation, page headings and v2 runtime/workspace/collaboration/memory/safety/provider/pixel-office surfaces use explicit translation keys.

First-run onboarding covers UI language, prerequisite detection and project registration.

Prerequisites: Git, Node, Cursor Agent, Claude Code, Codex CLI, Gemini CLI, OpenCode, Ollama.

Updater reads OFFICE_UPDATE_MANIFEST or update-manifest.json and applies OFFICE_UPDATE_PACKAGE through scripts/self-update.ps1 on Windows.
