---
name: docs-normalizer
description: Normalize project documentation into a clear canonical structure while preserving intent, history and unresolved decisions.
---

# Docs Normalizer

Preferred canonical structure:

docs/
  01-product/
  02-architecture/
  03-features/
  04-decisions/
  05-operations/
  06-status/
  references/

Create an index explaining canonical files.

Rules:
- do not silently resolve contradictory architectural/product decisions
- use DECISION REQUIRED for material conflicts
- preserve deprecated docs with references where useful
- repair internal links when files are intentionally reorganized
- do not duplicate the same truth across multiple files
