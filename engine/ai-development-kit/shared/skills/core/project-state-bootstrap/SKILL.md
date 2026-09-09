---
name: project-state-bootstrap
description: Create or repair missing AI Development Kit project state files before status, audit, planning or continuation workflows.
---

# Project State Bootstrap

Before state-dependent commands, ensure required files exist.

Required:
- PROGRESS.md
- PROJECT_STATE.md
- CLAUDE.md
- CURSOR.md
- .ai-kit/current-task.json
- .ai-kit/project-profile.json
- .ai-kit/installed-skills.json

If a file is missing:
1. create from kit conventions/template when possible
2. inspect repository/docs
3. populate only verified facts
4. mark unknown facts UNKNOWN
5. never mark implementation complete merely because docs exist

After creation/repair, continue the original requested command.
