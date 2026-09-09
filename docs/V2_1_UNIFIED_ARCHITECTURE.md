# v2.1 Unified Architecture

```text
AI DEVELOPMENT OFFICE
│
├── Desktop App / UI
│
├── Embedded AI Development Kit Engine
│   ├── Skills
│   ├── Commands
│   ├── Workflows
│   ├── Capabilities
│   ├── Compositions
│   ├── Project discovery
│   └── Project state
│
├── Universal Provider SDK
│   ├── OpenAI / Codex
│   ├── Anthropic / Claude
│   ├── Google Gemini
│   ├── xAI / Grok
│   ├── Groq
│   ├── Cursor
│   ├── OpenCode
│   ├── Ollama / Local
│   └── OpenAI-compatible
│
├── Autonomous Runtime
│   ├── Director
│   ├── Agents
│   ├── Memory
│   ├── Retry / Recovery
│   ├── Workers
│   └── Event Bus
│
├── Pixel Office V2
│   ├── Pixi.js target renderer
│   ├── Sprite animation
│   ├── Camera / zoom
│   ├── Pathfinding
│   ├── Stations
│   └── Runtime-driven movement
│
├── Safety / Governance / Git
│
└── Projects
```

## User model

Normal use should become:

```text
Open Office
→ Choose project
→ Give mission
→ Director plans
→ Kit selects development skills/workflows
→ Agents are selected
→ Provider router assigns models
→ Agents execute and collaborate
→ Tests / security / review
→ Retry/failover if necessary
→ Evidence / diff / result
→ User receives completed work
```

User intervention is reserved for guarded/high-risk operations or truly unresolved decisions.
