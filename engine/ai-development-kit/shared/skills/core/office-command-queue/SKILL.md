---
name: office-command-queue
description: Read and consume AI Development Office command requests truthfully without treating queued requests as completed work.
---

# Office Command Queue

When explicitly asked to consume Office commands or when an approved runner invokes this workflow:

1. read `.ai-kit/command-requests.jsonl`
2. choose oldest unconsumed request
3. validate command against AI Development Kit command contracts
4. emit Office command start telemetry
5. execute the real workflow
6. emit done/error telemetry
7. append result to `.ai-kit/command-results.jsonl`

Do not execute queued destructive/implementation commands silently without the configured approval policy.
