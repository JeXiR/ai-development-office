---
name: nextjs
description: Build Next.js applications with server-first rendering, clear client boundaries, stable data fetching and production-aware routing.
---

# Next.js

First inspect the installed Next.js version and whether the project uses App Router or Pages Router.

## App Router defaults
- Prefer Server Components.
- Add `use client` only where browser state/events/APIs require it.
- Keep client boundaries small.
- Perform protected server data access on the server.
- Use route handlers for HTTP contracts, not as unnecessary internal hops.
- Use framework caching/revalidation intentionally.
- Keep secrets server-only.
- Handle loading/not-found/error states explicitly.

## Performance
Avoid shipping large server-only dependencies to client bundles.
Do not convert entire layouts/pages to client components for one interactive child.
