---
name: tenant-storage
description: Isolate tenant files and object storage paths across local disks and S3-compatible storage.
---

# Tenant Storage

Use tenant-aware object keys/paths.

Example:
`tenants/{tenantId}/invoices/{invoiceId}.pdf`

Requirements:
- ownership checked on upload/download/delete
- signed URLs scoped to authorized resource
- no predictable public paths for private files
- lifecycle/retention preserves tenant boundaries
