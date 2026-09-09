# Security policy

AI Development Office runs locally and can dispatch Cursor, Claude, and other providers against folders you trust. Treat the Office like a development tool with write access — not like a toy UI.

## Supported versions

The current `package.json` version on the default branch is the supported line. Older ZIP installs are best-effort only.

## What to report privately

Report these **privately**, not as a public GitHub issue:

- ways to run file-changing provider commands without an explicit trusted UI action
- silent `--force`, permission bypass, or sandbox escape
- secret leakage (API keys, `.env.local`, AppData registries, clipboard/token logs)
- path traversal that writes outside a trusted project or the Office data directory
- anything that injects Office code or attribution into a user's application

## How to report

Contact the maintainer, **JeXiR (Halil Cinkilinc)**, through the private channel you already use for this repository. Include:

- Office version
- OS and Node version
- whether a project was marked trusted
- steps to reproduce
- impact (read, write, credential, or remote)

Do not attach live secrets. Redact tokens and local paths that are not needed to reproduce.

## Trust model (for reporters)

- Untrusted projects stay observational.
- Write-capable Cursor/Claude invocations are supposed to require an explicit Office action.
- Persistent data lives in `%LOCALAPPDATA%\AI-Development-Office` (or `OFFICE_DATA_DIR`), not inside the install folder.
- The Office must not modify user application code merely to visualize it.

## Thanks

Responsible reports help keep the Office a local tool people can actually trust.
