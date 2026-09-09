---
name: aws-cloudfront
description: Use CloudFront for CDN delivery with explicit origins, caching, invalidation and private content strategy.
---

# AWS CloudFront
- cache static immutable assets aggressively
- keep HTML/API caching explicit and safe
- forward only required headers/cookies/query params
- use origin access controls for private S3 origins
- define invalidation/versioned asset strategy
- preserve correct cache keys for tenant/user-sensitive content
