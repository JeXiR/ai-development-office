# AI Development Office

**Local mission control for multi-agent software work.**

You sit in a pixel office. You describe the work. The CEO assigns the specialist. The Office plans, executes, and verifies against your real project — without turning the UI into the source of truth.

[![Version](https://img.shields.io/badge/version-2.1.9-0F172A?style=flat-square)](CHANGELOG.md)
[![Stack](https://img.shields.io/badge/Next.js_15-React_19-000?style=flat-square&logo=nextdotjs)](#architecture)
[![Runtime](https://img.shields.io/badge/bridge-WebSocket-2563EB?style=flat-square)](#architecture)
[![UI](https://img.shields.io/badge/UI-EN%20%7C%20TR%20%7C%20DE%20%7C%20RU-334155?style=flat-square)](#features)
[![Attribution](https://img.shields.io/badge/built_by-JeXiR-7C3AED?style=flat-square)](LICENSE-NOTE.md)

<p align="center">
  <strong>Click a desk. Speak or type a task. The CEO routes it. The floor shows the work.</strong>
</p>

---

## Contents

- [What it is](#what-it-is)
- [How it works](#how-it-works)
- [Features](#features)
- [Getting started](#getting-started)
- [Architecture](#architecture)
- [Safety model](#safety-model)
- [Project data](#project-data)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## What it is

AI Development Office is a **local** control surface for AI-assisted development. It is not a hosted SaaS agent and it is not a theme pack. It is the room you work from.

A typical session looks like this:

1. Register a project and mark it **trusted**.
2. Open any pixel desk — the clicked agent reports in, but does not steal the work.
3. Type or speak the task and send it to the CEO.
4. The CEO assigns the right specialist.
5. The Office runs a **plan → execute → verify** loop against that project.
6. The floor, coverage strip, and command timeline show live progress.

The Office UI is read-only against your application code. Writes go through explicit, trusted actions — never because someone clicked a sprite.

---

## How it works

```text
  You (typed task / speech)
           │
           ▼
  ┌─────────────────────────────────────────┐
  │  Pixel Office UI                        │
  │  Next.js 15 · React 19 · Pixi.js        │
  │  desks · CEO routing · coverage · chat  │
  └──────────────────┬──────────────────────┘
                     │  WebSocket :8787
                     ▼
  ┌─────────────────────────────────────────┐
  │  Office Bridge                          │
  │  project registry · kit listener        │
  │  mission runner · safety gates          │
  └──────┬───────────────────┬──────────────┘
         │                   │
         ▼                   ▼
  Embedded Kit         Provider runtime
  .ai-kit events       Cursor · Claude
  docs / verify        OpenAI · Gemini · Grok · …
         │                   │
         └─────────┬─────────┘
                   ▼
           Trusted project folder
           (your repo, not the Office install)
```

Official work always goes through the **CEO**. Clicking a pixel agent opens that desk; it does not lock the mission to that role.

---

## Features

| Area | What you get |
| --- | --- |
| **Pixel floor** | Live office with desks, movement, and work talk in the selected UI language. |
| **CEO routing** | Any desk can receive a task; the CEO assigns the specialist. |
| **Mission loop** | Plan first, then execute, then verify. Findings queue instead of colliding. |
| **Coverage strip** | After `PROGRESS.md` exists, applicable stack domains show completion (frontend, backend, Flutter, security, …). |
| **Providers** | Cursor CLI and Claude Code as first-class runners, plus a universal provider SDK. |
| **Trust gates** | File-changing commands require an explicit trusted action. No silent `--force`. |
| **Persistence** | Registry and settings live outside the install directory so upgrades do not wipe the office. |
| **i18n** | Office UI and floor chat: English, Turkish, German, Russian. |
| **Windows desktop** | One-click launch via `office-desktop.cmd` / `office-desktop.ps1`. |

---

## Getting started

**Requirements:** Windows 10/11, [Node.js 22](https://nodejs.org/), and at least one execution provider ([Cursor CLI](https://cursor.com) `agent` and/or [Claude Code](https://claude.ai/download)).

```powershell
cd D:\AI-Development-Office
npm install
copy .env.example .env.local
.\office.ps1
```

Or double-click `office-desktop.cmd`.

The UI opens at [http://127.0.0.1:3000/](http://127.0.0.1:3000/). The bridge listens on `ws://localhost:8787`.

`.env.local` only needs:

```env
NEXT_PUBLIC_OFFICE_WS_URL=ws://localhost:8787
OFFICE_BRIDGE_PORT=8787
```

`OFFICE_PROJECT_PATH` is optional. Add projects from the Office UI.

Check runners:

```powershell
.\scripts\office-doctor.ps1
```

It is fine to have only one provider installed.

If you installed Cursor or Claude **while Office was already running**, restart Office so the bridge sees the new `PATH`.

Full Windows first-run notes (unblock ZIP, execution policy, Cursor/Claude install paths): [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md).

---

## Architecture

| Layer | Role |
| --- | --- |
| `src/` | Next.js Office UI, pixel floor, desks, settings. |
| `bridge/` | WebSocket server, kit listener, coverage, mission runner. |
| `engine/ai-development-kit/` | Embedded kit: commands, skills, project docs, verify. |
| `%LOCALAPPDATA%\AI-Development-Office` | `projects.json`, `settings.json`, command history. |
| Your project | Source of truth. Optional `.ai-kit/` telemetry. |

The Office may write Office-local preferences, layout, cached telemetry, and kit telemetry. It must not inject attribution into your business code or change application behavior just to visualize it.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/V2_1_UNIFIED_ARCHITECTURE.md](docs/V2_1_UNIFIED_ARCHITECTURE.md).

---

## Safety model

- **Reads are cheap.** Inspecting project state does not require extra confirmation.
- **Writes are gated.** File-modifying Cursor/Claude runs get `--force` / auto permissions only after you trigger a write-capable action in the UI.
- **Trust is per project.** Untrusted folders stay observational.
- **No silent bypass.** The Office prefers Claude `--permission-mode auto` over blindly skipping all permissions.
- **Data stays local.** Registry and settings are on your machine, not in the install ZIP.

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

---

## Project data

Default Windows location:

```text
%LOCALAPPDATA%\AI-Development-Office
```

Override with `OFFICE_DATA_DIR` in `.env.local` if you want the registry on another drive. Keep this folder when you replace the Office install.

---

## Documentation

| Doc | Use it for |
| --- | --- |
| [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) | First install, providers, doctor |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | UI / bridge / kit boundary |
| [docs/KIT_INTEGRATION.md](docs/KIT_INTEGRATION.md) | `.ai-kit` events and office state |
| [docs/PLAN_FIRST_WORKFLOW.md](docs/PLAN_FIRST_WORKFLOW.md) | Plan → execute → verify |
| [CHANGELOG.md](CHANGELOG.md) | What shipped in each version |
| [LICENSE-NOTE.md](LICENSE-NOTE.md) | Attribution |

Version history lives in `CHANGELOG.md` and `changelog/`. This README is the product surface, not a release diary.

---

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

The short version:

- One change per PR.
- `npm run typecheck` must pass.
- Show before / after evidence for UI work.
- Do not commit `.env.local`, credentials, or project registries.

---

## License

Copyright © JeXiR (Halil Cinkilinc).

See [LICENSE-NOTE.md](LICENSE-NOTE.md). Third-party libraries keep their own licenses. Do not remove creator attribution from redistributed Office documentation or metadata.

---

**Built by JeXiR (Halil Cinkilinc).**
