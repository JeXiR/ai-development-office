---
name: docker
description: Containerize and operate applications consistently across local development, CI, VPS and cloud environments.
---

# Docker

## Principles
- Use multi-stage builds for production images when appropriate.
- Keep images minimal and deterministic.
- Do not bake secrets into images.
- Use environment variables or secret stores at runtime.
- Add health checks where meaningful.
- Separate application, worker, scheduler, database and cache responsibilities.
- Persist only data that must survive container replacement.
- Make local Docker Compose architecture compatible with later ECS/Fargate migration where practical.

## Validation
- build succeeds from a clean checkout
- container starts without interactive steps
- health endpoint works
- migrations are controlled explicitly
- worker and scheduler lifecycle are defined
