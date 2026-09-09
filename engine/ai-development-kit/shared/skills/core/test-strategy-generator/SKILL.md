---
name: test-strategy-generator
description: Generate a risk-based testing strategy from the project's stack, architecture, features and existing test coverage.
---

# Test Strategy Generator

## Goal
Decide what must be tested, at which level, and why.

## Inputs
- project profile
- docs/features
- docs/architecture
- security baseline
- migration risk
- current test files
- package/composer scripts
- critical business modules

## Test levels
- unit
- integration
- feature/API
- component
- end-to-end
- contract
- security regression
- migration/database
- visual regression
- mobile device flow

## Risk model
Prioritize:
1. money / billing / invoices
2. auth / authorization
3. tenant isolation
4. destructive writes
5. external integrations
6. background jobs
7. migrations
8. uploads/storage
9. critical navigation/workflows
10. pure presentation

## Rules
- test business behavior, not implementation trivia
- avoid duplicate tests across levels
- use E2E only for high-value journeys
- add regression tests for previously broken behavior
- treat authorization and tenant isolation as dedicated test categories
- do not optimize for line coverage alone
