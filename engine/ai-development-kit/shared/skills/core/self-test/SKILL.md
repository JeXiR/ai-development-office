---
name: self-test
description: Execute safe smoke tests against the kit structure and scripts without mutating user projects.
---

# Self Test

Safe checks may include:
- JSON parse
- frontmatter parse
- PowerShell syntax parse when available
- expected file existence
- registry cross-reference checks
- zip/package generation validation

Do not run destructive installers against user projects during self-test.
