---
name: dependency-graph
description: Model capability dependencies, prerequisites, optional integrations and conflicts so project changes can be validated before installation.
---

# Dependency Graph

Use `shared/capabilities/dependency-graph.json`.

A capability may define:
- requires
- recommends
- conflicts
- replaces
- compatible_with
- stack constraints

Rules:
- resolve required dependencies first
- never auto-install conflicting capabilities
- recommendations require project intent unless harmless
- replacements require explicit migration intent
- validate graph after project sync
