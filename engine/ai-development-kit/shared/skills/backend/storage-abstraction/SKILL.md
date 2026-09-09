---
name: storage-abstraction
description: Keep application file logic portable across local disks, S3-compatible storage and future providers.
---

# Storage Abstraction

Use framework/provider abstraction when sufficient.

Laravel:
- filesystem disks
- Storage facade/contracts

Other stacks:
- define a narrow application storage interface

The interface should model business needs:
- put
- get/stream
- delete
- exists
- signed/public URL
- metadata

Do not mirror every cloud SDK method into the application contract.
