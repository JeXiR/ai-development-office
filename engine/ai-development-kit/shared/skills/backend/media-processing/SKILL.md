---
name: media-processing
description: Process images and media asynchronously with safe resource limits, deterministic variants and failure recovery.
---

# Media Processing

Define:
- original preservation policy
- output formats
- variant names/sizes
- compression quality
- metadata stripping policy
- orientation handling
- animation handling
- video/audio limits when supported

Prefer async processing for expensive transformations.
Make processing idempotent.
