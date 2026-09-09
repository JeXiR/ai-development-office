# v2 Plugin SDK — rc.14

Added:
- Plugin API version 2.0
- Manifest discovery and validation
- Per-project enable/disable state
- Permission enforcement
- Project-root path isolation
- Hook runtime
- 15 second hook timeout
- Crash isolation
- Automatic disable after repeated failures
- Provider contributions
- Tool contributions
- Trigger contributions
- UI panel contributions
- Example tool/UI plugin
- Example provider plugin
- Example trigger plugin

Plugin execution is disabled unless the plugin itself is enabled. Network, read and write capabilities require explicit declared permissions.

Stable remains locked.
