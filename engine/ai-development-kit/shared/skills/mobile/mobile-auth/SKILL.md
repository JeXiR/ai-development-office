---
name: mobile-auth
description: Implement secure mobile authentication with token lifecycle, refresh, logout, biometrics and device storage boundaries.
---

# Mobile Authentication

## Requirements
- short-lived access tokens where token auth is used
- secure refresh-token storage
- clear expiry/refresh behavior
- revoke/clear credentials on logout
- handle account switch
- prevent refresh storms
- handle app resume after long suspension
- distinguish biometric local unlock from server authentication

Do not store long-lived credentials in plaintext storage.
Biometrics should protect local credential access, not pretend to replace server-side auth.
