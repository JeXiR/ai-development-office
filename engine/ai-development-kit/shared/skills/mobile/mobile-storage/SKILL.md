---
name: mobile-storage
description: Store mobile data safely by separating secrets, durable preferences, cache and offline domain data.
---

# Mobile Storage

Classify data:
1. credentials/secrets
2. user preferences
3. cached server data
4. offline domain data
5. temporary UI state

Use secure keychain/keystore-backed storage for sensitive tokens when appropriate.
Do not store secrets in AsyncStorage/plain files.
Version persisted schemas when migrations may be needed.
Define logout/account-switch cleanup behavior.
