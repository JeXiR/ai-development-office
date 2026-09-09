---
name: image-optimization
description: Generate and serve optimized image variants with responsive sizes, modern formats and cache-safe URLs.
---

# Image Optimization

Consider:
- WebP/AVIF where supported
- original fallback
- responsive widths
- thumbnails
- quality budget
- EXIF/orientation
- content hash/versioned URLs
- CDN cache headers

Do not regenerate expensive variants on every request.
