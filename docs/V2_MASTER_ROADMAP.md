# AI Development Office v2 — Master Roadmap

Created and maintained by **JeXiR (Halil Cinkilinc)**.

## Goal

Build a real autonomous software-development environment by combining:
- AI Development Kit governance, canonical backlog, coverage, audit and release gates
- real agent runtimes and terminals
- integrated IDE/Git tooling
- Director/supervisor orchestration
- mailbox, blackboard and persistent memory
- event-driven pixel office UX
- provider routing, cost controls and safety systems

## Delivery sequence

### v2.0.0-alpha.1 — Runtime Core
- [x] Runtime Event Bus
- [x] PTY Process Manager
- [x] Cursor/Claude provider abstraction foundation
- [x] Runtime WebSocket actions
- [x] Trusted-project spawn gate
- [x] Spawn/write/resize/terminate/list
- [ ] UI live terminal

### v2.0.0-alpha.2 — Workspace
- [x] xterm.js live terminal UI
- [x] Monaco editor
- [x] file explorer
- [x] file watching
- [x] Git diff viewer
- [x] task/agent change-set foundation

### v2.0.0-alpha.3 — Director & Collaboration
- [x] Office Director
- [x] task decomposition
- [x] agent mailbox
- [x] shared blackboard
- [x] dependency router
- [x] structured artifact passing

### v2.0.0-alpha.4 — Memory
- [x] per-agent memory
- [x] shared memory
- [x] semantic memory search
- [x] condensation/retention
- [x] Director memory context
- [x] lessons / decisions / history records

### v2.0.0-alpha.5 — Safety & Control
- [x] circuit breaker
- [x] pause/resume
- [x] steer/constrain
- [x] terminate policies
- [x] repeated-error detection
- [x] repeated-command detection
- [x] no-progress detection
- [x] token/cost/time ceilings
- [x] protected paths

### v2.0.0-beta.1 — Providers
- [x] Codex
- [x] Gemini
- [x] OpenCode
- [x] local/OpenAI-compatible provider foundation
- [x] task-aware provider routing
- [x] health-aware routing
- [x] latency/cost-aware scoring
- [x] failover
- [x] provider executable discovery
- [x] session resume abstraction

### v2.0.0-beta.2 — Pixel Office Runtime
- [x] real event-driven avatar state
- [x] tool→station mapping
- [x] avatar movement from runtime events
- [x] speech/thinking bubbles
- [x] mailbox/envelope animation
- [x] file-change animation
- [x] terminal modal
- [x] live task status visualization

### v2.0.0-beta.3 — Product UX
- [x] native component-level i18n foundation
- [x] DOM translation hack removed
- [x] onboarding wizard
- [x] provider prerequisite checker/installer
- [x] project setup wizard using existing project registry
- [x] one-click updater foundation

### v2.0.0-rc.1 — Product maturity
- [ ] scheduler
- [ ] heartbeat
- [ ] cost/token ledger
- [ ] Git graph/history/compare
- [ ] plugin SDK
- [ ] Slack/webhook workers
- [ ] local/remote workers
- [ ] migrations/event replay/backup compatibility

### v2.0.0 — Stable
- [ ] runtime regression suite
- [ ] E2E suite
- [ ] upgrade tests
- [ ] disaster recovery verification
- [ ] full documentation
