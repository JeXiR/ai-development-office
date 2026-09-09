# Audit Coverage Matrix

A `review project` is not "complete" merely because findings were produced.

For each applicable area record: `CHECKED`, `PARTIAL`, `NOT_CHECKED`, or `NOT_APPLICABLE`.

Minimum domains:
- architecture
- backend
- frontend
- routes / API
- database / migrations
- authentication
- authorization
- tenancy / isolation
- security
- queues / jobs / scheduler
- storage / uploads
- external integrations / webhooks
- tests
- lint / typecheck
- build
- CI
- deployment
- secrets / environment
- observability / logging
- backup / recovery where applicable

A review summary must distinguish:
- verified finding
- suspected finding
- unreviewed area

Never turn `NOT_CHECKED` into an implicit pass.
