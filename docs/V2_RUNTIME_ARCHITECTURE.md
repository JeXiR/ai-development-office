# v2 Runtime Architecture — alpha.1

## Layers

```text
Web UI
  ↕ WebSocket
Bridge
  ↕
AgentProcessManager
  ↕
node-pty
  ↕
Cursor / Claude / future providers

AgentProcessManager
  → RuntimeEventBus
  → WebSocket runtime_event
  → future Pixel Office / Terminal / Analytics
```

## WebSocket API

- `runtime_list`
- `runtime_spawn`
- `runtime_write`
- `runtime_resize`
- `runtime_terminate`
- `runtime_terminate_project`

Events:
- `runtime_sessions`
- `runtime_spawned`
- `runtime_event`

Runtime event types:
- `runtime.session.starting`
- `runtime.session.started`
- `runtime.session.output`
- `runtime.session.input`
- `runtime.session.resized`
- `runtime.session.stopping`
- `runtime.session.exited`
- `runtime.session.failed`

## Safety

`runtime_spawn` is rejected unless the project is marked `runnerTrusted`.

The UI does not yet expose arbitrary shell execution. Provider sessions are launched only through the Office provider resolver.
