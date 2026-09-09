# Release Package Layout

```text
AI-Development-Office-v2.1.0/
├── office-desktop.cmd
├── office-desktop.ps1
├── office-desktop.sh
├── package.json
├── office.manifest.json
├── release-integrity.json
├── engine/
│   └── ai-development-kit/
├── src/
├── bridge/
├── desktop/
├── scripts/
├── docs/
└── changelog/
```

The release ZIP excludes:
- `node_modules`
- `.next`
- `.git`

These are intentionally rebuilt/installed on the target system.
