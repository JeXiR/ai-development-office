---
name: component-reuse
description: Find and reuse existing frontend components before creating new ones, while avoiding forced reuse of unsuitable abstractions.
---

# Component Reuse

Before creating a component:
1. search by visual purpose
2. search by semantic purpose
3. inspect component library/design system
4. inspect neighboring screens
5. inspect purchased template references if applicable

Reuse when:
- semantics match
- behavior matches
- extension is small and coherent

Create new when:
- reuse would add confusing conditional logic
- semantics differ materially
- existing abstraction is already overloaded

Never create `Button2`, `NewCard`, `CustomInputFinal` to bypass an existing system.
Refactor naming/variants intentionally if needed.
