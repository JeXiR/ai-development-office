# One-click desktop package

Office stays a Next.js + bridge app. The installer vendors Node so the user does not need it on PATH.

```text
npm run package:desktop
scripts/windows/install-office.ps1
```

`install-office.ps1` copies the app and, if Node is missing, downloads official portable Node into `runtime/node`.

Signing is optional and never faked. Set `OFFICE_CODESIGN_CERT` (Windows PFX or thumbprint) or `OFFICE_CODESIGN_IDENTITY` (macOS). Optional `OFFICE_CODESIGN_PASSWORD` and `OFFICE_CODESIGN_TIMESTAMP`. Without those, `package:desktop` reports unsigned.
