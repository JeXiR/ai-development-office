---
name: upload-security-auditor
description: Audit file upload flows for type validation, size limits, storage isolation, public exposure and dangerous executable content.
---

# Upload Security Auditor

Check:
- extension + MIME validation
- size limits
- filename normalization
- public/private storage
- executable/script upload risk
- image/document processing
- signed/private download strategy
- tenant/user ownership
- direct object access
- antivirus/malware hook for higher-risk domains

Do not trust client-provided MIME or filename alone.
