---
name: private-file-access
description: Control private file access using authorization and short-lived signed URLs or authenticated streaming.
---

# Private File Access

For private assets:
- authorize the resource before issuing access
- prefer short-lived signed URLs for object storage
- avoid predictable unauthenticated paths
- keep bucket/container private by default
- log sensitive download events only when useful and privacy-safe

Signed URL generation is not authorization by itself; authorization must happen first.
