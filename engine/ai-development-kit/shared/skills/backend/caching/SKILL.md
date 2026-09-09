---
name: caching
description: Add caching safely with explicit ownership, keys, invalidation, TTLs and stampede awareness.
---

# Caching

Before caching, identify the actual bottleneck.

For every cache entry define:
- key namespace
- tenant/user scope
- TTL
- invalidation owner
- stale-data tolerance

Avoid caching authorization decisions longer than their safe lifetime.
Do not cache secrets.
Consider locks/single-flight behavior for expensive hot keys.
