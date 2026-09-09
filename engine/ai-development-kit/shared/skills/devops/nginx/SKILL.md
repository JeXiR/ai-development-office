---
name: nginx
description: Configure Nginx safely as reverse proxy/static server with TLS, forwarded headers, caching and application-specific routing.
---

# Nginx

- Preserve correct `Host` and forwarded headers.
- Redirect HTTP to HTTPS when TLS termination occurs here.
- Do not expose private application/storage paths.
- Configure upload/body/timeouts intentionally.
- Serve immutable static assets with suitable caching.
- Keep dynamic HTML/API caching explicit.
- For Laravel, route non-static requests through the front controller.
- For container environments, resolve services by stable service names.
