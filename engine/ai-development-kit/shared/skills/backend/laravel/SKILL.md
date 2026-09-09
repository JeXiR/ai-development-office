---
name: laravel
description: Implement Laravel applications using framework-native conventions for HTTP, validation, services, models, events, jobs, queues, cache and storage.
---

# Laravel

## First inspect
- Laravel version
- PHP version
- installed first-party packages
- existing app structure and conventions

## Default conventions
- Form Requests for substantial request validation
- Policies/Gates for authorization
- Eloquent relationships and query scopes
- API Resources for public API serialization
- Jobs for durable asynchronous work
- Events/listeners only when decoupling is useful
- Cache through Laravel cache contracts
- Files through Laravel filesystem abstraction
- configuration through config files, not direct `env()` calls outside config
- database changes through migrations

## Controllers
Keep controllers orchestration-focused. Move substantial business logic into cohesive domain/application classes only when the responsibility warrants it.

## Transactions
Use transactions when multiple writes must succeed/fail together. Do not wrap network calls in DB transactions unless unavoidable.

## Queue safety
Queued work should be idempotent where retries can occur.
