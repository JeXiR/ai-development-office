# Project Readiness Contract v1

Author: JeXiR (Halil Cinkilinc)

Purpose:
Determine whether AI Development Kit can safely scaffold and validate a project from its documented requirements.

## Readiness states

- `READY`
- `PARTIAL`
- `MISSING`
- `CONFLICT`

## Rule

A project is scaffold-ready only if every required capability is:
- READY, or
- explicitly accepted as PARTIAL by an approved preset composition.

Any required `MISSING` or unresolved `CONFLICT` blocks scaffolding.

## Evidence sources

1. project docs / roadmap / architecture
2. `.ai-kit/project-profile.json`
3. capability registry
4. preset registry
5. scaffold scripts/templates
6. validators/generators

## Required report

The readiness report must include:

- required capabilities
- detected kit support
- evidence
- missing capabilities
- conflicting decisions
- compatible presets
- recommended preset composition
- scaffold readiness
- next action

Do not claim readiness from skill presence alone.
A capability is only READY when the kit has enough implementation to scaffold or validate it.
