# v2 Automation Architecture — rc.1

Scheduled missions persist in `.ai-kit/automation/state.json`.

Supported cadence:
- once
- hourly
- daily
- weekly

Mission execution uses the existing runtime provider routing layer. Failed missions can be retried with bounded backoff.

Heartbeat state is stored per project and can be triggered manually or configured for an interval.
