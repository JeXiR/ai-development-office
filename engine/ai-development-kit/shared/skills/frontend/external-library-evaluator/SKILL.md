---
name: external-library-evaluator
description: Evaluate third-party frontend libraries, component registries and GitHub repositories for fit, maintenance, license, dependencies and migration risk.
---

# External Library Evaluator

Evaluate before adding a new external dependency/source.

## Score dimensions

### Need
Does this solve a real requirement better than existing project tools?

### Compatibility
Does it support the project's framework/runtime versions?

### Dependency cost
What additional packages or native/browser capabilities are required?

### Maintenance
Is the project maintained and understandable?

### Ownership
Will copied source code become our responsibility?

### License
Can we legally use and modify it in the target project?

### Performance
What does it add to runtime/bundle/GPU/network cost?

### Accessibility
Does it preserve keyboard, semantics and reduced motion?

### Exit strategy
Can it be removed/replaced without rewriting the application?

Reject components that score poorly on multiple critical dimensions even if they look impressive.
