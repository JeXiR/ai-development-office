# v2 Provider Architecture — beta.1

## Providers

- Cursor
- Claude
- Codex
- Gemini
- OpenCode
- Local / OpenAI-compatible foundation

## Engine

```text
Task
  ↓
Provider Router
  ├─ capability score
  ├─ health
  ├─ latency
  ├─ relative cost
  ├─ preferred provider
  └─ local-only constraint
       ↓
Selected Provider
       ↓
Session Factory
       ↓
PTY Runtime
```

## Health

The Office checks provider executables and runs a short `--version` probe.
Status:
- healthy
- degraded
- unavailable
- unknown

## Failover

`provider_failover` chooses the best non-current available provider using the same routing model.

## Resume abstraction

Provider-specific resume arguments are isolated in `ProviderSessionFactory`.
This keeps runtime/process management provider-agnostic.

## Environment overrides

Executable paths can be overridden with:

- `OFFICE_CURSOR_EXECUTABLE`
- `OFFICE_CLAUDE_EXECUTABLE`
- `OFFICE_CODEX_EXECUTABLE`
- `OFFICE_GEMINI_EXECUTABLE`
- `OFFICE_OPENCODE_EXECUTABLE`
- `OFFICE_LOCAL_EXECUTABLE`

## Bridge API

- `provider_health`
- `provider_route`
- `provider_failover`

`runtime_spawn` now accepts:
- `provider: auto|cursor|claude|codex|gemini|opencode|local`
- `resume_token`
- `task`
