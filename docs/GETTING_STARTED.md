# Getting started

First-run notes for AI Development Office on Windows. The product overview lives in the root [README.md](../README.md).

## Requirements

- Windows 10 or 11
- Node.js 22
- At least one execution provider: Cursor CLI (`agent`) and/or Claude Code (`claude`)

A project folder is **not** required to start the Office. Add projects from the UI after launch.

## 1. Unblock a downloaded ZIP

After extracting:

```powershell
cd D:\AI-Development-Office
Get-ChildItem "D:\AI-Development-Office" -Recurse -File | Unblock-File
```

Or:

```powershell
.\scripts\windows-unblock.ps1
```

Recommended PowerShell policy:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Do not globally switch Windows to `Unrestricted`.

## 2. Install dependencies

```powershell
cd D:\AI-Development-Office
npm install
```

## 3. Configure Office

If `.env.local` is missing, `office.ps1` copies it from `.env.example`.

```env
NEXT_PUBLIC_OFFICE_WS_URL=ws://localhost:8787
OFFICE_BRIDGE_PORT=8787
```

`OFFICE_PROJECT_PATH` is optional. Do not hardcode a sample app as the default project.

Optional persistent-data override:

```env
OFFICE_DATA_DIR=D:\AI-Development-Office-Data
```

Default Windows data location:

```text
%LOCALAPPDATA%\AI-Development-Office
```

This keeps `projects.json`, `settings.json`, and command history safe when the Office application itself is upgraded.

## 4. Cursor CLI runner

Official native Windows install:

```powershell
irm 'https://cursor.com/install?win32=true' | iex
```

Verify:

```powershell
agent --version
where.exe agent
```

Login:

```powershell
agent login
```

Typical native Windows location:

```text
%LOCALAPPDATA%\cursor-agent\agent.cmd
```

The Office checks both `PATH` and this known location.

Cursor headless mode uses `agent -p "..."`. For commands that must modify files, Office adds `--force` only after a write-capable action was explicitly triggered in the Office UI.

## 5. Claude Code runner

Official native Windows install:

```powershell
irm https://claude.ai/install.ps1 | iex
```

Verify:

```powershell
claude --version
where.exe claude
```

Health check:

```powershell
claude doctor
```

Authenticate by starting a first session:

```powershell
claude
```

Typical native installer path:

```text
%USERPROFILE%\.local\bin\claude.exe
```

Office uses non-interactive Claude Code:

```text
claude -p --permission-mode auto "<prompt>"
```

The `auto` permission mode is preferred over blindly bypassing all permissions.

## 6. Check both runners

```powershell
cd D:\AI-Development-Office
.\scripts\office-doctor.ps1
```

It is fine to have only one provider installed.

## 7. Start Office

```powershell
cd D:\AI-Development-Office
.\office.ps1
```

One-click Windows path:

```text
office-desktop.cmd
```

The UI opens at http://127.0.0.1:3000/. The bridge listens on `ws://localhost:8787`.

If you installed Cursor or Claude **while Office was already running**, restart Office so the bridge process sees the new environment.

After changing `bridge/server.ts`, restart the bridge (or run `npm run office` again).
