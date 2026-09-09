---
name: aws-s3
description: Implement portable object storage with Amazon S3 while keeping application code storage-provider agnostic.
---

# AWS S3

Use S3 for object/blob storage such as uploads, generated files, exports and media.

## Architecture
Application code should depend on a storage interface/adapter rather than raw S3 calls throughout the domain.

## Requirements
- private-by-default buckets
- explicit public delivery strategy
- presigned URLs when appropriate
- lifecycle rules for temporary/archival data
- server-side encryption
- correct content types and cache headers
- upload size/type validation
- tenant-aware object keys for multi-tenant systems
- avoid exposing AWS credentials to clients
