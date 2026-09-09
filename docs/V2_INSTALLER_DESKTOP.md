# v2 Installer / Updater / Desktop Packaging — rc.13

Added:
- prerequisite detection
- hardened detached provider installer launches
- current version consistency checks
- staged updater
- staged verification
- rollback snapshot preparation
- explicit apply / rollback gates
- Windows `office.cmd` launcher
- PowerShell install/uninstall foundations
- desktop runtime info
- first-run diagnostics

Notes:
- Updater uses staged copy + verification rather than live overwrite as the first step.
- Stable packaging remains locked.
- Installer scripts do not delete runtime project data automatically.
