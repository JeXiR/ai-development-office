---
name: api-contract-layer
description: Establish an API contract as a shared source of truth across Laravel, Next.js, React and Expo clients.
---

# API Contract Layer

## Goal
Keep backend and clients synchronized through an explicit contract.

Prefer OpenAPI for HTTP APIs.

Contract should define:
- paths
- methods
- auth requirements
- parameters
- request bodies
- response schemas
- status codes
- pagination
- validation errors
- domain errors
- version/deprecation metadata

## Rules
- backend implementation must match contract
- clients should consume generated or contract-derived types when practical
- do not silently change response shapes
- distinguish nullable, optional and missing fields
- document error shapes
- breaking changes require explicit review
