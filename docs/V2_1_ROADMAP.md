# AI Development Office v2.1 Roadmap

## Product direction

**AI Development Office becomes the single product.**
The AI Development Kit becomes the embedded development engine inside Office.

```text
AI Development Office
├── Desktop / UI
├── Embedded AI Development Kit Engine
├── Universal Provider SDK
├── Autonomous Runtime
├── Pixel Office V2
├── Safety / Governance
└── Projects
```

## Milestones

### alpha.1 — Unified architecture foundation
- Embedded Kit Engine contracts
- Kit discovery/version/capability snapshot
- Universal Provider SDK contracts
- Built-in provider manifests
- Pixel Office V2 scene/runtime contracts
- Carry-over gaps documented

### alpha.2 — Embedded Kit Engine runtime
- Load Kit skills / commands / workflows / capabilities
- Project discovery
- Capability resolution
- Project state sync
- Kit health/version UI

### alpha.3 — Single-source embedded Kit
- real Kit embedded in Office
- Kit Settings / Skills integration

### alpha.4 — Universal Provider SDK runtime
- provider registry
- executable adapter foundation
- health/model discovery
- capability routing
- failover
- provider Settings panel
- secret-safe configuration

### alpha.5 — Native provider hardening
- Anthropic / Claude native adapter
- Gemini native adapter
- xAI / Grok native adapter
- normalized tools / structured output
- usage normalization
- per-agent provider pinning foundation

### alpha.6 — Unified provider streaming
- provider-neutral stream events
- cancellation
- token/usage updates
- tool-call stream lifecycle
- runtime/Pixel Office integration foundation
- provider stream monitor

### alpha.7 — Provider assignment & policy UI
- per-agent provider pinning UI
- model pinning
- fallback policy
- quality/cost/latency preference
- provider routing evidence

### alpha.8 — Secure credentials + autonomous provider orchestration
- secure provider API key UI/store
- provider connection tests
- Director planning uses Kit capabilities + provider pins/policy
- mission-level provider requirements
- routing evidence
- provider telemetry ledger foundation

### alpha.9 — Account connections + autonomous execution loop
- browser/subscription login foundation
- Codex / Claude Code / Gemini CLI / Cursor / GitHub connections
- API fallback remains available
- Director executes mission plan
- agent task dispatch
- provider retry/failover during execution
- telemetry writes
- final result aggregation

### alpha.10 — Quality feedback & execution hardening
- provider result quality scoring
- mission retry policy
- test/review stages
- approval gates
- persistent execution history
- mission history UI

### alpha.11 — Adaptive routing & evidence
- route quality feedback into provider scoring
- provider performance dashboard
- mission-level evidence bundle
- test/review evidence persistence
- approval inbox integration
- execution replay

### alpha.12 — Mission runner UX
- one-shot mission composer
- live mission progress
- approval resume
- evidence/replay viewer
- result summary
- “give task → receive result” primary workflow

### alpha.13 — Project Docs Intelligence
- existing docs → mission queue
- user brief → canonical project docs
- ROADMAP / PROGRESS / PROJECT_STATE integration
- manual missions sync back to PROGRESS / PROJECT_STATE
- shared Development Kit status vocabulary

### alpha.14 — Real project execution integration
- actual project workspace/tool actions
- tool-call execution loop
- tests from project
- Git diff/evidence
- working tree isolation
- result-to-code verification

### alpha.15 — Pixel Office V2 renderer
- Pixi.js scene renderer
- professional original sprite system
- camera/zoom
- stations/rooms
- animation state machine
- click/hit testing + terminal integration

### alpha.16 — Pixel Office runtime movement
- grid pathfinding
- desk/station assignment
- runtime event mapping
- live task movement
- four-direction facing
- agent-to-agent communication animation
- mission/provider event integration

### alpha.17 — One-click desktop runtime
- single launcher
- Bridge/Web coordinated startup
- embedded Kit verification
- last-project restore
- provider CLI discovery/bootstrap
- browser launch
- graceful shutdown
- desktop packaging foundation

### alpha.18 — Full UI polish
- TR/EN/DE/RU completion
- no raw heading keys
- tooltip single-open/collision handling
- readability floor
- dense layout cleanup

### beta.1 — Unified integration hardening
### beta.2 — Real CallMe autonomous validation
### rc.1 — Release candidate/security/upgrade/recovery
### rc.2 — Final acceptance & packaging
### v2.1.0 — Stable

### alpha.4 — Provider settings / BYOK
- secure credential abstraction
- provider connection tests
- routing preferences
- per-agent provider pinning
- local provider setup

### alpha.5 — Pixel Office V2 renderer
- Pixi.js scene
- sprites
- camera
- stations
- runtime state mapping
- animation controller

### beta.1 — Pixel Office V2 movement
- pathfinding
- desk assignment
- task-driven movement
- agent messages
- QA/Security/Git/Terminal station transitions

### beta.2 — One-click desktop runtime
- one launcher
- bridge/runtime/kit startup
- project restore
- provider health bootstrap
- desktop packaging foundation

### beta.3 — Autonomous mission flow
- task → Director → Kit skills → agents → providers
- retries / failover
- tests / review / evidence
- result delivery
- approval only for guarded actions

### rc.1 — Integration hardening
- Safety v2 across network/distributed/plugins
- timers / watchers
- provider health async
- distributed timeout/cancel
- secret storage

### rc.2 — UX / i18n / readability
- full TR/EN/DE/RU
- tooltip single-open + collision handling
- full workspace tabs/search/split
- typography normalization

### rc.3 — Final acceptance
- Windows packaging
- CallMe autonomous real-project run
- full regression/build/security/recovery
- upgrade/rollback
- provider matrix
- Pixel Office V2


## Single-source repository decision

Starting with `v2.1.0-alpha.3`, AI Development Kit is stored inside the Office repository at:

`engine/ai-development-kit/`

This is the canonical/default Kit source. Office and Kit are developed, packaged and version-tested from one repository/artifact.

External Kit paths are no longer part of normal runtime discovery. `AI_DEVELOPMENT_KIT_PATH` is accepted only when `AI_DEVELOPMENT_KIT_DEV_OVERRIDE=1`, for explicit development/testing overrides.
