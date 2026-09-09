---
name: storage-metadata
description: Model file metadata, ownership, checksums, variants and storage location independently from raw object paths.
---

# Storage Metadata

Useful metadata:
- file ID
- tenant/user owner
- storage disk/provider
- object key
- original filename
- MIME type
- size
- checksum/hash
- visibility
- processing state
- created/updated timestamps
- retention class
- variant relationships

Prefer opaque application file IDs over exposing raw object keys directly.
