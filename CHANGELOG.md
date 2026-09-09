## 2.1.9 — Runtime Stability + Project-Neutral Startup

### Real browser findings
- Pixel Office hit `Maximum update depth exceeded` because `seedAgents()` always emitted a new Zustand state object.
- GlobalContextHelp synchronously unmounted generated React roots while React was still rendering.
- `.env.example` incorrectly hardcoded the CallMe test project, making the reusable Office look project-specific.

### Fixed
- `seedAgents()` now updates state only when a genuinely new agent is inserted.
- GlobalContextHelp defers generated-root unmounts to the next browser task.
- `OFFICE_PROJECT_PATH` is optional.
- `.env.example` no longer contains CallMe or any other default project.
- `office.ps1` no longer refuses to start without a project.
- Desktop startup supports `Project: none selected`.
- Last-project restore remains available as normal product behavior.
- CallMe is only the acceptance-test target.
- Added `runtime-stability:smoke`.

### Required
Real browser/Desktop runtime retest.


## 2.1.8 — Windows Desktop Launch Hotfix

### Real Windows finding
A clean-install launch of `office-desktop.ps1` failed with `spawn EINVAL` while ProcessSupervisor attempted to spawn `npm.cmd` directly with `shell:false`.

### Fixed
- Windows npm/npx `.cmd` execution now routes through `cmd.exe /d /s /c`.
- Desktop runtime explicitly loads `.env.local`.
- `office-desktop.ps1` now bootstraps `.env.local` and dependencies on a clean install.
- `office.ps1` no longer forces a second launch immediately after creating `.env.local` when the template already contains a project path.
- Added `desktop-windows-launch:smoke` and included it in RC1.

### Required
Real Windows desktop launch must be rerun.


## 2.1.7 — Dependency Security Hotfix

### Real Windows evidence inherited from v2.1.6
- Typecheck: PASS
- Production build: PASS
- Beta gate: PASS
- RC1 gate: PASS
- RC2 gate: PASS
- Real CallMe validation: PASS
- CallMe Laravel tests: 327 passed, 1 skipped, 1358 assertions
- CallMe frontend build: PASS

### npm audit finding
The remaining audit findings were rooted in `postcss <=8.5.22` through Next.js `^15.2.0`.

### Fixed
- Keep the validated Next.js `^15.2.0` line.
- Add npm override `postcss: 8.5.28`.
- Avoid `npm audit fix --force`, which would introduce a breaking Next.js 16 major upgrade.
- Add `security-dependency-policy:smoke` and include it in RC1.

### Required retest
Run `npm install`, then `npm ls postcss`, `npm audit`, and final acceptance on Windows.


## 2.1.6 — Git Fingerprint Validation Hotfix

### Fixed
- Replaced tracked Git stability comparison based only on porcelain status labels with SHA-256 fingerprints of:
  - tracked worktree diff (`git diff --binary`)
  - staged/index diff (`git diff --cached --binary`)
- Detects content changes even when a file was already dirty before validation and its status remains `M`.
- Keeps untracked runtime/test artifacts non-blocking.
- Fixed the CallMe Git Stability smoke so it verifies the actual content-change invariant.
- Added dedicated `git-fingerprint:smoke`.

### Validation
A fresh Windows smoke + CallMe validation run is required.


## 2.1.5 — CallMe Git Stability Hotfix

### Real Windows evidence from v2.1.4
- Office typecheck: PASS.
- Office production build: PASS.
- Beta gate: 17/17 PASS.
- RC1 gate: 4/4 PASS.
- RC2 gate: 4/4 PASS.
- CallMe detected as Laravel/Inertia/React and ready.
- CallMe `php artisan test`: 327 passed, 1 skipped, 1358 assertions.
- CallMe frontend build: PASS.
- CallMe Git HEAD before/after: identical.

### Fixed
The CallMe validator previously compared the complete `git status --short` string before and after validation. Test/build-generated untracked artifacts could therefore cause a false FAIL even when tracked source and HEAD were unchanged.

v2.1.5 now:
- compares HEAD before/after;
- compares tracked/staged status with `--untracked-files=no`;
- allows temporary untracked runtime/test artifacts;
- still fails if tracked/staged project state changes;
- reports untracked status changes as informational evidence.

### Remaining
- Rerun real CallMe validation.
- Review exact npm audit findings.
- Complete manual security review.


## 2.1.4 — CallMe Validation CLI Hotfix

### Real Windows evidence inherited from v2.1.3
- Typecheck: PASS.
- Production build: PASS.
- Beta gate: 17/17 PASS.
- RC1 gate: PASS.
- RC2 gate: 4/4 PASS.

### Fixed
- Removed top-level `await` from `scripts/callme-validate.ts`.
- Added explicit async `main()` and `.catch()` error boundary for CJS-compatible `tsx` execution.
- Added `callme-cli:smoke`.
- Added the CLI smoke to the RC1 gate.

### Remaining
- Rerun real CallMe validation.
- Review exact `npm audit` findings.
- Complete manual security review.

## 2.1.3 — Final Validation Hotfix

### Fixed from real Windows RC2 output
- Replaced direct `ProtectedData` PowerShell use with Windows `SecureString` DPAPI round-trip while still passing secrets via stdin.
- Added capability aliases and coverage-first autonomous agent selection so `testing` selects QA agents.
- Hardened Pixel Office pathfinding so it never returns a one-point path and provides a conservative outer-corridor fallback.
- Rewrote UI copy audit to flag only literal rendered translation keys, avoiding false positives for `t(...)`, dictionaries and metadata.
- Added a focused `final-four:smoke` regression test.

### Real validation status
The previous Windows RC2 run passed 12/16 beta checks and identified exactly four failures. v2.1.3 addresses those four; Windows RC2 rerun is required.


## 2.1.2 — Final Gate Windows Hotfix

### Real Windows evidence
- `npm run typecheck`: PASS on v2.1.1.
- `npm run build`: PASS on v2.1.1.
- Next.js production build completed successfully; four non-blocking autoprefixer alignment warnings were observed.

### Fixed
- Replaced nested Windows `spawnSync("npm.cmd")` gate execution with `cmd.exe /d /s /c "npm run <script>"`.
- Beta/RC1/RC2 gates now print the exact child script being run and failed-script summary.
- Removed hardcoded `2.1.0-rc.2` from version consistency smoke.
- Stable promotion smoke now uses the current package version.
- Stable verifier now validates the current package version.
- Cleaned mixed-support `start/end` flex alignment declarations reported by autoprefixer.
- Improved final-acceptance PowerShell failure output and optional pause behavior.

### Validation
RC2 gate and real CallMe validation require a fresh Windows rerun.


## 2.1.1 — Typecheck Integration Hotfix

### Fixed
- Restored `has`, `remove`, `mode`, and `updatedAt` compatibility methods on `SecureProviderCredentialStore`.
- Updated provider base `createSession` signature to match the universal adapter contract.
- Allowed embedded Kit skill source in Bridge skill discovery.
- Fixed autonomous mission `reviewStage` typing.
- Fixed Mission Runner and Provider Assignment agent access through active project state.
- Repaired Pixel Office live-store event/message integration and missing selectors.
- Added `missionId` to replay frame typing.
- Excluded standalone embedded Kit project templates from Office TypeScript compilation.
- Prevented pseudo orchestration success from being written as `VERIFIED_DONE` without real project validation.

### Validation
This hotfix is based directly on the real Windows `tsc --noEmit` report containing 35 errors in 13 files.
A fresh Windows `npm run typecheck` is required to confirm the hotfix.


## 2.1.0 — Stable

### Stable release
- Unified AI Development Office + embedded AI Development Kit.
- Docs-driven and manual Mission Runner workflows.
- Autonomous provider orchestration foundations.
- Real project file/command/test/Git execution.
- Pixel Office V2 renderer and runtime movement.
- One-click desktop runtime.
- Security, backup, recovery and upgrade foundations.
- Final acceptance and package integrity gates.

### Validation status
Stable artifact created. Real Windows/CallMe final acceptance, npm audit review and manual security review remain pending and are explicitly recorded in the release manifest.


## 2.1.0-rc.2 — Final Acceptance & Packaging

### Added
- Final release evidence bundle.
- Stable promotion policy.
- Version consistency checks.
- Release integrity manifest and SHA-256 verification.
- Final Acceptance UI.
- RC2 gate.
- Windows final acceptance runner.
- Stable promotion checklist and package layout documentation.

### Stable gate
Stable remains blocked until real Windows/CallMe, npm audit and manual security evidence are complete.

### Release train
1 planned release remains after rc.2: v2.1.0 Stable.


## 2.1.0-rc.1 — Security / Upgrade / Recovery

### Added / Hardened
- DPAPI secret input moved from command arguments to stdin.
- Central safe/guarded/high/blocked operation policy.
- Runtime backup/restore with SHA-256 manifests.
- Last-known-good snapshots.
- Runtime schema migrations.
- Upgrade compatibility checks.
- Security & Recovery Settings panel.
- RC1 security smoke and consolidated RC1 gate.

### Validation
Real Windows CallMe validation and fresh npm audit review remain required.

### Release train
2 planned releases remain after rc.1 before v2.1.0 Stable.


## 2.1.0-beta.2 — Real CallMe Autonomous Validation

### Added
- CallMe-specific stack detection.
- Read-only real-project validation runner.
- Laravel test validation.
- Frontend typecheck/build validation when available.
- Git HEAD/status stability verification.
- Persistent validation reports.
- CallMe Validation Settings panel.
- Read-only autonomous canary mission definition.
- One-command Windows validation PowerShell script.
- CallMe validation checklist.

### Validation
The real `D:\laragon\www\callme` project is not accessible from the artifact-building environment, so real Windows execution remains pending.

### Release train
3 planned releases remain after beta.2 before v2.1.0 Stable.


## 2.1.0-beta.1 — Unified Integration Hardening

### Added
- Unified runtime readiness checks.
- Mission result/state consistency validator.
- Unified event normalizer.
- Integration event journal.
- Integration Readiness Settings panel.
- Unified integration smoke.
- Beta gate chaining the major alpha smokes/audits.
- Explicit beta validation status document.

### Validation
Internal syntax/static validation is performed during artifact construction.
Real Windows `npm install`, typecheck, build, beta gate and npm audit remain required.

### Release train
4 planned releases remain after beta.1 before v2.1.0 Stable.


## 2.1.0-alpha.18 — Full UI / i18n / Tooltip / Readability Polish

### Added / Fixed
- Localized raw heading keys.
- TR/EN/DE/RU coverage for the major v2.1 panels.
- Single-open, viewport-aware tooltips.
- Reduced automatic help-icon density.
- Readability/font/spacing floor.
- Responsive dense Settings layouts.
- Hard-failing UI copy audit.

### Release train
5 planned releases remain after alpha.18 before v2.1.0 Stable.


## 2.1.0-alpha.17 — One-Click Desktop Runtime

### Added
- One-click Office runtime supervisor.
- Coordinated Bridge + Web startup.
- Embedded Kit verification.
- Last-project restore.
- Provider CLI discovery.
- Browser launch and health checks.
- Graceful process shutdown.
- Windows CMD/PowerShell launchers.
- Desktop Runtime Settings panel.

### Release train
6 planned releases remain after alpha.17 before v2.1.0 Stable.


## 2.1.0-alpha.16 — Pixel Office Runtime Movement & Event Mapping

### Added
- Grid pathfinding.
- Walking interpolation and four-direction facing.
- Live station retargeting.
- Mission/provider runtime event mapping.
- Agent-to-agent envelope/message animation.
- Movement smoke test.

### Release train
7 planned releases remain after alpha.16 before v2.1.0 Stable.


## 2.1.0-alpha.15 — Pixel Office V2 Renderer

### Added
- Pixi.js Pixel Office V2 scene renderer.
- Original programmatic pixel sprite system.
- Professional room/station layout.
- Animation state foundation.
- Camera pan/zoom.
- Agent hit testing and terminal integration.
- Pixel Office V2 renderer smoke test.

### Release train
8 planned releases remain after alpha.15 before v2.1.0 Stable.


## 2.1.0-alpha.14 — Real Project Execution Integration

### Added
- Real project file tools.
- Safe project command runner.
- Provider tool-call execution loop.
- Test command detection/execution.
- Git status/diff evidence.
- Git worktree isolation foundation.
- Mission Runner real-project mode.
- Project-root, sensitive-file and destructive-command guards.
- Locked v2.1 release train with remaining release count.

### Release train
9 planned releases remain after alpha.14 before v2.1.0 Stable.


## 2.1.0-alpha.13 — Project Docs Intelligence

### Added
- Existing project docs → Mission Runner task queue.
- User brief → generated ROADMAP / PROGRESS / PROJECT_STATE / decisions docs.
- Manual mission completion → PROGRESS / PROJECT_STATE sync.
- Project Docs Intelligence Office panel.
- Shared Development Kit status vocabulary.
- Project Docs Intelligence smoke test.


## 2.1.0-alpha.12 — Mission Runner UX

### Added
- Primary Mission Runner UI.
- One-shot mission composer.
- Live execution phase tracker.
- Live mission event feed.
- Approval resume UI.
- Result, evidence and replay viewers.
- Mission Runner smoke test.


## 2.1.0-alpha.11 — Adaptive Routing & Evidence

### Added
- Provider quality feedback integrated into routing scores.
- Adaptive routing dashboard.
- Mission evidence bundles.
- Approval inbox.
- Mission event journal and replay foundation.
- Adaptive routing and evidence/replay smoke tests.


## 2.1.0-alpha.10 — Autonomous Execution Hardening

### Added
- Mission and agent retry policies.
- Approval gates.
- Test and review stages.
- Persistent mission history.
- Mission history UI.
- Provider quality feedback store.
- Quality/retry/approval smoke tests.


## 2.1.0-alpha.9 — Account Connections + Autonomous Execution Loop

### Added
- Account/browser login connection model.
- Codex/ChatGPT account connection.
- Claude Code account connection.
- Gemini CLI Google-account connection.
- Cursor browser-login connection.
- GitHub browser-login connection.
- API key remains available as fallback.
- Autonomous mission execution loop.
- Agent dispatch, provider retry/failover, telemetry and final aggregation.
- Account connection Settings panel.
- Account/execution smoke tests.

### Note
Office does not claim every provider/account has free usage. Quotas and billing remain provider-controlled.


## 2.1.0-alpha.8 — Secure Provider Credentials + Autonomous Provider Orchestration

### Added
- Settings API-key entry for OpenAI, Claude, Gemini, Grok, Groq and OpenAI-compatible providers.
- Secret-safe local provider credential store.
- Windows DPAPI CurrentUser encryption target.
- Provider connection testing.
- Autonomous mission requirement classification.
- Embedded Kit capability-driven agent selection.
- Agent provider/model pin + provider policy orchestration.
- Routing evidence in autonomous mission plans.
- Provider telemetry ledger foundation.
- Credential and autonomous orchestration smoke tests.

### Security
Secret values are never returned to browser clients and are not stored as plaintext.


## 2.1.0-alpha.7 — Provider Assignment & Policy UI

### Added
- Per-agent provider selection.
- Per-agent model pinning.
- Balanced / Quality / Cost / Latency routing preference.
- Configurable failover attempts.
- Persisted fallback provider order and provider weights.
- Routing evidence and reason visibility.
- Provider policy smoke test.


## 2.1.0-alpha.6 — Unified Provider Streaming

### Changed
- AI Development Kit changelog/release-note files now live under `engine/ai-development-kit/changelog/`.

### Added
- Provider-neutral streaming event bus.
- Unified stream lifecycle events.
- Stream cancellation.
- Anthropic native streaming parser.
- Gemini SSE streaming parser.
- xAI Responses streaming parser.
- Bridge stream broadcast.
- Settings stream monitor.
- Streaming smoke test.


## 2.1.0-alpha.5 — Native Provider Hardening

### Added
- Anthropic / Claude native Messages adapter.
- Gemini native generateContent adapter.
- xAI / Grok native Responses adapter.
- Provider-neutral tool-call and usage normalization.
- Gemini structured JSON response support.
- Per-agent provider pin persistence foundation.
- Native adapter smoke tests.
- Provider pinning smoke test.

### Deferred
Unified streaming remains scheduled for alpha.6 so all providers share one event protocol rather than exposing provider-specific stream shapes directly to Office.


## 2.1.0-alpha.4 — Universal AI Provider Runtime

### Added
- Universal provider runtime registry.
- Health/config/model discovery.
- OpenAI-compatible HTTP adapter foundation.
- OpenAI, Groq and custom compatible runtime foundations.
- Cursor/OpenCode CLI adapters.
- Ollama local adapter.
- Capability/health-aware router.
- Three-attempt automatic failover.
- Bridge provider actions.
- Settings Universal Provider Runtime panel.
- Secret-safe provider configuration state.
- Synthetic failover smoke test.

### Not yet complete
Anthropic/Claude, Gemini and xAI/Grok still need their provider-specific execution adapters and streaming/tool normalization.


## 2.1.0-alpha.3 — Single-Source Embedded Kit + Office Integration

### Added
- Bundled AI Development Kit v3.5.5 under `engine/ai-development-kit`.
- Embedded Kit is now the default/canonical runtime source.
- External Kit path is development-override only.
- Real Kit 3.5.x parser support for shared skills, workflows, capability catalog and compositions.
- Bridge actions for Kit snapshot, validation, project resolution and project sync.
- Settings → Embedded Kit Engine panel.
- Skills Hub now includes embedded Kit skills.
- Real embedded Kit smoke test.

### Architecture
Office and Kit now ship from one repository/artifact so they can be developed and validated together.

### Status
Alpha development. Universal provider runtime and Pixel Office V2 renderer are still upcoming.


## 2.1.0-alpha.2 — Embedded AI Development Kit Engine Runtime

### Added
- Working Kit filesystem/runtime loader.
- Version, skill, command, workflow, capability and composition discovery.
- Project stack discovery for Node, React, Next.js, NestJS, Expo, Laravel, Flutter, Python, Docker and CI signals.
- Capability resolver.
- `.ai-kit/office-kit-state.json` synchronization.
- Kit validation and bridge helpers.
- `kit-engine:smoke` synthetic integration test.

### Status
- Alpha development.
- Real Kit payload is not bundled yet.
- Office UI wiring for Kit health/version is scheduled next.


## 2.1.0-alpha.1 — Unified Architecture Foundation

### Added
- v2.0 carry-over gap registry.
- v2.1 roadmap.
- Embedded AI Development Kit Engine contracts and locator foundation.
- Universal AI Provider SDK contracts.
- Built-in provider manifests for OpenAI, Claude, Gemini, xAI/Grok, Groq, Cursor, OpenCode, Ollama and OpenAI-compatible endpoints.
- Pixel Office V2 scene/runtime contracts.
- Unified Office + Kit + Provider + Runtime architecture documentation.

### Status
- Alpha foundation only.
- Existing 2.0.x Stable line remains separate.
- Real provider calls, embedded Kit execution and Pixi.js renderer are not yet implemented in alpha.1.


## 2.0.6 — Full Runtime i18n / Dashboard Audit Patch

### Fixed
- Added all runtime/UI translation keys detected by the v2.0.5 usage audit.
- Added real TR/EN/DE/RU text for onboarding, workspace, collaboration, provider, safety, updater and project setup.
- Runtime translation lookup now combines core, legacy/runtime and current dictionaries.
- Dashboard render audit now scans the complete component tree instead of assuming Pixel Office is declared directly in OfficeDashboard.

### Validation
- Created from the real Windows v2.0.5 audit output.
- Browser validation remains pending.


## 2.0.5 — Runtime Dashboard / i18n Patch

### Fixed
- Dashboard runtime layout hardened so rendered content cannot remain hidden by legacy layout rules.
- Core navigation and Pixel Office i18n keys restored in TR/EN/DE/RU.
- Stable footer now displays `STABLE`.
- Context-help labels prefer accessible/title text instead of concatenated icon/text content.
- i18n audit now checks core keys and referenced translation keys.
- Added dashboard render audit.

### Validation
- Created from the real v2.0.4 browser DOM snapshot: dashboard content existed in DOM but was visually hidden, while core i18n keys rendered raw.
- Final runtime validation remains pending.


## 2.0.4 — Release Acceptance Semver Patch

### Fixed
- Stable version validation no longer uses the incorrectly double-escaped regex.
- Release acceptance now validates `major.minor.patch` using numeric version parts.

### Validation
- v2.0.3 typecheck: PASS
- v2.0.3 full regression: 7/7 PASS
- This patch only addresses the remaining release-acceptance assertion.


## 2.0.3 — Regression / Release Acceptance Patch

### Fixed
- Git snapshot creation now preserves the raw Git patch instead of trimming the final newline.
- Git snapshot restore normalizes the patch and applies it through stdin, avoiding Windows patch corruption.
- Release acceptance now validates Stable metadata instead of requiring an RC version.

### Validation
- Created from v2.0.2 user-side full-regression and release-acceptance results.
- Security regression: PASS on v2.0.2.
- Crash/restart smoke: PASS on v2.0.2.
- Final validation remains pending.


## 2.0.2 — Validation Patch

### Fixed
- Safety v2 secret masking now redacts Bearer tokens and other supported secret formats correctly.
- i18n audit no longer flags the Global Context Help `MutationObserver`; only legacy i18n DOM translation usage is banned.
- Obsolete `memory_snapshot` broadcast removed from the bridge when no longer consumed by the current client store.

### Validation
- Created from v2.0.1 user-side smoke/audit results.
- Full validation remains in progress.


## 2.0.1 — Typecheck Validation Patch

### Fixed
- Awaited bridge actions now run inside an async WebSocket message handler.
- Autonomy uses the actual project-state and provider-health APIs.
- Security regression uses WorkspaceService.read().
- Workspace listing hides common `.env` files.
- Task DAG reads Director/collaboration tasks from the collaboration store.
- Duplicate Memory v2 imports removed.
- Workspace search uses the real flat file store.
- Obsolete legacy-memory socket handlers removed from Memory v2.
- Safety v2 command classifier regex/type definitions corrected.

### Validation
- Patch created from the first real v2.0.0 user-side typecheck.
- Final validation remains pending.


## 2.0.0 — Stable

### Release status
- Stable package created by explicit user request before final acceptance testing.
- Post-release validation remains pending.
- Internal Stable acceptance gate remains locked until validation is completed.

### Added / Completed
- Autonomous agent intelligence
- Safety & Permissions v2
- Memory v2
- Integrations v2
- Distributed execution
- Office / IDE UX and Pixel Office polish
- Native TR/EN/DE/RU i18n
- Installer / updater / desktop foundation
- Plugin SDK v2
- Governance Final
- Global contextual help
- System architecture and communication documentation

### Validation
- Final user-side validation pending.



## 2.0.0-rc.15.3 — Documentation & Architecture Polish

### Added
- Full system communication architecture to README.
- Agent/runtime, Git/release, Memory, Safety and Stable release flow diagrams.
- Formal changelog/release-note policy.

### Changed
- README now documents the Office as an integrated project-scoped event/state architecture rather than only a feature list.

### Release status
- Release Candidate.
- Stable Gate remains locked until final acceptance tests and explicit user approval.

# Changelog

AI Development Office release notes are stored in this folder.

## Releases

- [v1.1.8](./changelog/CHANGELOG-v1.1.8.md) — queue typecheck hotfix
- [v1.1.7](./changelog/CHANGELOG-v1.1.7.md) — Queue Manager + dynamic version UI
- [v1.1.6](./changelog/CHANGELOG-v1.1.6.md) — nullable typecheck hotfix
- [v1.1.5](./changelog/CHANGELOG-v1.1.5.md) — typecheck hotfix
- [v1.1.4](./changelog/CHANGELOG-v1.1.4.md) — defensive work-item merge hotfix
- [v1.1.3](./changelog/CHANGELOG-v1.1.3.md) — kit-listener crash hotfix
- [v1.1.2](./changelog/CHANGELOG-v1.1.2.md) — findings reconciliation hotfix
- [v1.1.1](./changelog/CHANGELOG-v1.1.1.md) — state/queue/coverage hotfix
- [v1.1.0](./changelog/CHANGELOG-v1.1.0.md) — Pixel Theme Engine + 2× characters + 12px minimum text
- [v1.0.2](./changelog/CHANGELOG-v1.0.2.md) — typography/readability hotfix
- [v1.0.1](./changelog/CHANGELOG-v1.0.1.md) — hydration compatibility hotfix
- [v1.0.0](./changelog/CHANGELOG-v1.0.0.md) — **STABLE / FEATURE FROZEN**
- [v0.19.0](./changelog/CHANGELOG-v0.19.0.md)
- [v0.18.0](./changelog/CHANGELOG-v0.18.0.md)
- [v0.17.0](./changelog/CHANGELOG-v0.17.0.md)
- [v0.16.2](./changelog/CHANGELOG-v0.16.2.md)
- [v0.16.1](./changelog/CHANGELOG-v0.16.1.md)
- [v0.16.0](./changelog/CHANGELOG-v0.16.0.md)
- [v0.15.1](./changelog/CHANGELOG-v0.15.1.md)
- [v0.15.0](./changelog/CHANGELOG-v0.15.0.md)
- [v0.14.1](./changelog/CHANGELOG-v0.14.1.md)
- [v0.14.0](./changelog/CHANGELOG-v0.14.0.md)
- [v0.13.3](./changelog/CHANGELOG-v0.13.3.md)
- [v0.13.2](./changelog/CHANGELOG-v0.13.2.md)
- [v0.13.1](./changelog/CHANGELOG-v0.13.1.md)
- [v0.13.0](./changelog/CHANGELOG-v0.13.0.md)
- [v0.12.0](./changelog/CHANGELOG-v0.12.0.md)
- [v0.11.0](./changelog/CHANGELOG-v0.11.0.md)
- [v0.10.1](./changelog/CHANGELOG-v0.10.1.md)
- [v0.10.0](./changelog/CHANGELOG-v0.10.0.md)
- [v0.9.2](./changelog/CHANGELOG-v0.9.2.md)
- [v0.9.1](./changelog/CHANGELOG-v0.9.1.md)
- [v0.9.0](./changelog/CHANGELOG-v0.9.0.md)
- [v0.8.0](./changelog/CHANGELOG-v0.8.0.md)
- [v0.7.1](./changelog/CHANGELOG-v0.7.1.md)
- [v0.7.0](./changelog/CHANGELOG-v0.7.0.md)
- [v0.6.1](./changelog/CHANGELOG-v0.6.1.md)
- [v0.6.0](./changelog/CHANGELOG-v0.6.0.md)
- [v0.5.2](./changelog/CHANGELOG-v0.5.2.md)
- [v0.5.1](./changelog/CHANGELOG-v0.5.1.md)
- [v0.5.0](./changelog/CHANGELOG-v0.5.0.md)
- [v0.4.0](./changelog/CHANGELOG-v0.4.0.md)
- [v0.3.1](./changelog/CHANGELOG-v0.3.1.md)
- [v0.3.0](./changelog/CHANGELOG-v0.3.0.md)
- [v0.2.2](./changelog/CHANGELOG-v0.2.2.md)
- [v0.2.1](./changelog/CHANGELOG-v0.2.1.md)
- [v0.1.2](./changelog/CHANGELOG-v0.1.2.md)
