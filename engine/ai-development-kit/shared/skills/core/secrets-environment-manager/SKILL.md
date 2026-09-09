---
name: secrets-environment-manager
description: Manage environment variables and secrets safely across local, staging, production, Docker, Laravel, Next.js, Expo and AWS without exposing sensitive values.
---

# Secrets & Environment Manager

## Goals
- keep secret values out of source control and AI-readable documentation
- keep `.env.example` complete without containing real secrets
- detect environment drift
- separate public/client-safe variables from private/server-only variables
- map deploy-time secrets to appropriate secret stores

## Inspect
- `.env*`
- `.env.example`
- Laravel config files
- Next.js environment usage
- Expo app config/environment usage
- Docker/Compose environment blocks
- CI/CD secret references
- AWS secret/config references

## Classification
Every environment variable should be one of:

1. public configuration
2. server-only configuration
3. secret credential/token/key
4. generated secret
5. infrastructure endpoint
6. feature flag
7. build-time value

## Rules

- Never print real secret values in docs, logs or generated reports.
- Never copy `.env` contents wholesale into AI context.
- Never commit credentials.
- `.env.example` should contain names and safe placeholders only.
- Client-exposed environment variables must be treated as public.
- Do not place private API keys in `NEXT_PUBLIC_*`, Expo public config, browser bundles or mobile bundles.
- Prefer workload identities/roles over static cloud credentials.
- Rotate exposed secrets rather than merely deleting them from Git.
- Do not automatically overwrite a user's real `.env`.

## Environment parity
Compare variable names across:
- local
- staging
- production
- CI
- Docker
- cloud

Report:
- missing variables
- stale variables
- client/private classification mismatches
- unused variables
- secrets referenced in unsafe locations

## AWS
Prefer:
- IAM roles for workloads
- Secrets Manager for secret values
- SSM Parameter Store for non-secret or lower-sensitivity configuration where appropriate

Business logic must not depend directly on the chosen secret store.
