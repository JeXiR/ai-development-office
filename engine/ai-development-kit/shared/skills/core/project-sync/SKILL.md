---
name: project-sync
description: Re-analyze a project, compare the desired AI skill profile to the currently managed installation and safely synchronize Cursor and Claude skills.
---

# Project Sync

1. Re-run project analysis.
2. Build desired project skill set.
3. Read `.ai-kit/installed-skills.json`.
4. Compute:
   - add
   - update
   - remove
   - unchanged
5. Preserve unmanaged/custom project skills.
6. Synchronize only kit-managed skills.
7. Update managed manifest.
8. Validate Cursor/Claude parity.
9. Report architecture drift.

Removal is allowed only for skills previously marked `managed_by: ai-development-kit`.
