---
name: project-discovery-engine
description: Discover project intent from existing docs and repository evidence, normalize project documentation, and bootstrap a canonical roadmap before progress tracking begins.
---

# Project Discovery Engine

## Purpose
PROGRESS.md must not be the first source of truth.

Order:
1. discover docs
2. discover repository
3. identify product intent
4. normalize/validate documentation
5. establish canonical roadmap
6. derive project state and progress

## Search docs semantically for
- roadmap
- TODO
- plan
- milestones
- product
- requirements
- architecture
- features
- decisions
- specification
- deployment
- security
- operations

File names may be arbitrary or multilingual.

## If roadmap-like docs exist
- read them
- detect duplicates/conflicts/stale documents
- classify by purpose
- preserve user-authored intent
- create a canonical docs index
- propose/perform safe organization
- derive ROADMAP.md and PROGRESS.md from verified evidence

## If no usable project intent/roadmap exists
Ask one concise question:
"What do you want to build?"

Then create the minimum complete project documentation set from that idea.
Do not interrogate the user about low-risk implementation details.
