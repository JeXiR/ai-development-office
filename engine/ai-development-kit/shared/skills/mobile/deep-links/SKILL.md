---
name: deep-links
description: Implement secure deep links and universal/app links with validated routes, auth handoff and fallback behavior.
---

# Deep Links

Define:
- supported URL schemes/domains
- route mapping
- unauthenticated flow
- post-login continuation
- invalid/expired target handling
- external fallback

Validate route parameters.
Never execute privileged actions solely because a link was opened.
