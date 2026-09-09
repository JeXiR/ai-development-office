# v2 Remote Workers — rc.3

Worker kinds:
- local
- SSH
- Docker

Workers are persisted under `.ai-kit/workers/workers.json`.

The pool performs health checks and selects an online worker by tags and concurrency pressure.
