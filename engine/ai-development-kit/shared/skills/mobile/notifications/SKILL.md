---
name: notifications
description: Implement push and local notifications with explicit permission UX, routing, token lifecycle and safe payload handling.
---

# Notifications

Define:
- permission request timing
- device token registration
- token refresh/revocation
- notification categories/channels
- foreground/background behavior
- tap/deep-link destination
- logout/account switch cleanup

Never place sensitive content in notification payloads unnecessarily.
Do not ask notification permission before the user understands the value.
