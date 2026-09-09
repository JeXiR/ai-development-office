---
name: mobile-security
description: Review mobile applications for secret storage, transport security, local data exposure, auth lifecycle and platform-specific risks.
---

# Mobile Security

Check:
- no secrets/API private keys bundled in app
- secure credential storage
- HTTPS/TLS only for production APIs
- sensitive local data minimized/encrypted where required
- screenshots/app-switcher exposure for highly sensitive screens when applicable
- clipboard leakage
- exported Android components / URL schemes
- debug logging stripped or non-sensitive
- logout clears sensitive state
- server enforces authorization regardless of client checks

Assume the client device is not a trusted security boundary.
