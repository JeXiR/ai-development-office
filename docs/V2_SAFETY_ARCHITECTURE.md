# v2 Safety Architecture — alpha.5

## Circuit breaker

Signals:
- repeated errors
- repeated commands
- repeated progress signatures / no-progress
- token ceiling
- cost ceiling
- runtime ceiling
- protected path access

Actions:
- warn
- constrain
- pause
- stop

## Runtime controls

- `runtime_pause`
- `runtime_resume`
- `runtime_steer`
- `runtime_constrain`
- `runtime_terminate`

Observation actions:
- `runtime_command_observed`
- `runtime_progress_observed`
- `runtime_usage`
- `runtime_safety_check`

## Protected paths

Default protections include:
- `.env`
- `.env.local`
- `.git/`
- `vendor/`
- `node_modules/`
- runtime/cache directories

Workspace writes to protected paths are blocked and surfaced as safety incidents when an active runtime session exists.

## Important

alpha.5 implements control-plane safety and runtime gating. Provider-specific native pause semantics may differ; Office controls remain the canonical interface.
