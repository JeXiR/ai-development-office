---
name: secret-leak-detector
description: Detect likely hard-coded secrets, credentials and unsafe client exposure patterns without reproducing sensitive values.
---

# Secret Leak Detector

Look for:
- API keys
- private tokens
- passwords
- private keys
- database URLs with credentials
- AWS access keys
- OAuth client secrets
- JWT signing secrets
- SMTP credentials
- webhook secrets

## Reporting
Never echo the full detected value.
Report:
- file/path
- line/area when available
- secret type
- severity
- remediation

Mask examples like:
`AKIA...ABCD`
`sk-...xyz`

## Client exposure
Check:
- `NEXT_PUBLIC_*`
- browser-injected config
- Expo public config
- bundled mobile constants
- source maps/logs

Any value shipped to a browser/mobile client must be treated as public.
