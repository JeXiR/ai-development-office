---
name: hallucination-guard
description: Reduce coding-agent hallucination by requiring repository evidence, written project state and explicit uncertainty before assertions or changes.
---

# Hallucination Guard

Before asserting project facts:
- verify repository files
- verify docs/state
- verify command/test output when relevant

Never invent:
- installed packages
- framework versions
- routes
- database columns
- completed features
- test results
- deployment status
- prior decisions

When evidence is missing:
state `UNKNOWN` or inspect the repository.

## Continuation rule
For "continue", "keep going", "finish the project":
1. read `PROGRESS.md`
2. read current task state
3. inspect relevant repository areas
4. continue from the first verified unfinished item

Do not choose a new task from memory alone.
