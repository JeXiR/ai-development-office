---
name: upload-security
description: Secure file uploads through type/size validation, filename normalization, content inspection and storage isolation.
---

# Upload Security

Validate:
- allowed MIME types
- extension
- maximum size
- user/tenant ownership
- expected file count
- filename normalization
- decompression/archive limits if supported

Do not trust browser-provided MIME/type alone.
Store untrusted uploads outside executable/public application paths.
Reject dangerous active content unless explicitly required.
