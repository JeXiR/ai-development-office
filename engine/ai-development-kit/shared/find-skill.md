# Find Skill Router

Canonical implementation:

`shared/skills/core/find-skill/SKILL.md`

This router inspects the project's docs, manifests, repository structure and the current task.
It selects the minimum relevant skill set instead of loading the entire AI Development Kit.

## Purpose

Example project:

- Laravel
- Blade
- MySQL
- Docker
- S3

Task:
"Create a new invoice list page."

Expected routing:

- project-context
- laravel
- blade
- eloquent
- mysql
- design-system
- responsive-ui
- accessibility
- testing

AWS/Docker skills should NOT be activated merely because the project uses them.

Task:
"Move invoice PDFs to S3."

Expected routing:

- project-context
- architecture
- laravel
- aws-foundations
- aws-s3
- security
- testing

The router is task-aware, not only stack-aware.
