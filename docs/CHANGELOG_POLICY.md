# Changelog Policy

AI Development Office follows a release-note discipline for every RC, patch and Stable release.

For every version:
1. Update `package.json` and `office.manifest.json`.
2. Add a dedicated entry under `changelog/`.
3. Update the root `CHANGELOG.md`.
4. Update `README.md` when architecture, user-visible behavior, setup or major capabilities change.
5. Record migration, compatibility, security and known limitations when applicable.
6. Never label a release candidate as Stable.
7. Stable release notes must include final acceptance evidence and explicit approval status.

Recommended release note sections:
- Added
- Changed
- Fixed
- Security
- Compatibility
- Known limitations
- Validation
