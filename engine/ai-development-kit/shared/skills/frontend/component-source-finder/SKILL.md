---
name: component-source-finder
description: Discover suitable external UI components, effects, blocks or animation patterns from approved sources and evaluate them before integration.
---

# Component Source Finder

Use this skill when the current project needs a component, block, visual effect, animation, background, chart treatment, interaction pattern or landing-page section that may already exist externally.

## Core rule

Do not search for code merely because building from scratch is inconvenient.
Search when an external source can materially improve:
- quality
- speed
- interaction fidelity
- visual polish
- maintainability

## 1. Understand the requirement

Identify:
- component/effect type
- current framework
- styling stack
- animation stack
- SSR/client constraints
- accessibility requirements
- performance budget
- commercial licensing requirements
- project design-system constraints

## 2. Search approved sources first

Prefer sources registered in:

`shared/external-sources/registry.json`

Possible source types:
- component distributions
- animation libraries
- GitHub repositories
- paid template libraries
- visual builders/reference tools
- official framework examples

## 3. Evaluate before use

For each candidate evaluate:

### Compatibility
- framework/version
- TypeScript support
- Tailwind/CSS/styled approach
- App Router / SSR compatibility
- React Native vs web
- required runtime dependencies

### Quality
- maintained?
- readable source?
- composable?
- accessible?
- responsive?
- production suitable?

### Performance
- bundle impact
- WebGL/Three.js requirement
- animation library requirement
- client-only execution
- mobile/GPU cost

### Security
- suspicious scripts?
- remote code?
- unsafe HTML?
- unnecessary network requests?

### License
- free/open-source/commercial?
- license compatible with project?
- attribution required?
- per-developer/per-project restrictions?
- redistribution restrictions?

## 4. Integration mode

Choose one explicitly:

A. inspiration only
B. algorithm/effect adaptation
C. selected component copy/adaptation
D. registry install
E. package dependency
F. purchased-template/code reuse

Never silently switch between these modes.

## 5. Adapt to project

External components must conform to:
- existing design tokens
- existing component API conventions
- accessibility rules
- responsive rules
- project animation conventions
- current framework architecture

Do not let an external component dictate the whole project architecture.

## 6. Validation

After integration:
- run type/lint/build checks
- inspect visual output
- inspect responsive behavior
- inspect reduced-motion behavior
- inspect bundle/dependency impact
- record source/license if required
