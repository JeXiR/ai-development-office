---
name: api-breaking-change-detector
description: Compare API contract revisions and flag likely breaking changes before backend or client deployment.
---

# API Breaking Change Detector

Classify:
- BREAKING
- POTENTIALLY_BREAKING
- SAFE_ADDITIVE
- INFO

Review:
- removed paths/methods
- removed response properties
- new required request properties
- schema type changes
- enum restrictions
- auth changes
- response status changes
- pagination/error envelope changes

A technically additive change can still be operationally risky; use context.
