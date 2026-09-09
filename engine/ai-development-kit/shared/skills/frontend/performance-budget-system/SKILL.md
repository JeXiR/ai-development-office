---
name: performance-budget-system
description: Define and enforce measurable frontend performance budgets for bundle size, images, requests, Core Web Vitals and route-specific targets.
---

# Performance Budget System

## Budget categories
- JS bundle
- CSS bundle
- image payload
- font payload
- request count
- LCP
- INP
- CLS
- route startup/render time
- mobile startup when relevant

## Principles
- budgets are product constraints, not vanity metrics
- use route-specific budgets for heavy dashboards vs landing pages
- block regressions above agreed thresholds
- investigate before raising budgets
- third-party scripts count toward the budget

## Output
Define thresholds in a machine-readable project file.
