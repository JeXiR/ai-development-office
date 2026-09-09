---
name: crash-reporting
description: Integrate crash/error reporting for mobile apps without leaking sensitive user data and with actionable release context.
---

# Crash Reporting

Capture:
- release/build version
- platform/device/runtime
- stack trace
- navigation/context breadcrumbs when safe
- handled vs unhandled errors

Do not capture:
- passwords
- auth tokens
- sensitive form values
- unnecessary personal data

Define source map/symbol upload as part of release automation.
