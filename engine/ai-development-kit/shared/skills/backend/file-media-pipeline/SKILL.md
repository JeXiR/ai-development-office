---
name: file-media-pipeline
description: Design portable file and media handling across local storage and S3-compatible object storage with secure access, metadata, optimization and retention.
---

# File & Media Pipeline

## Goals
- storage-provider independence
- secure uploads/downloads
- tenant-aware organization
- private/public separation
- signed access for private assets
- metadata ownership
- lifecycle/retention
- image/media optimization
- observability

## Architecture
Application/domain code should depend on a storage/media service contract, not scattered direct S3 SDK calls.

## Typical flow
1. validate intent and ownership
2. validate file metadata
3. upload to temporary/private location when appropriate
4. inspect/scan/process
5. persist metadata
6. promote/finalize object
7. generate access URL based on policy
8. observe failures and cleanup orphans
