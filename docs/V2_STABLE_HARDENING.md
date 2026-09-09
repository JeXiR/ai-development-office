# v2 Stable Hardening — rc.4

This release candidate adds the final automated hardening layer before the remaining product-completion RCs and eventual stable release.

Suites:
- full regression
- security regression
- crash/restart persistence
- provider failover simulation
- agent lifecycle simulation
- migration idempotency
- replay consistency
- backup/restore round-trip
- Git snapshot round-trip
- worker-pool selection
- release acceptance

Stable remains intentionally locked. The final v2.0.0 package must not be cut until:
1. all automated suites pass on the user's Windows machine;
2. Office UI runtime passes;
3. CallMe real-project acceptance passes;
4. provider/runtime/safety/recovery tests pass;
5. the user explicitly approves stable packaging.
