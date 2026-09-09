---
name: aws-route53
description: Manage DNS in Route 53 with safe record changes, routing strategy and verification.
---

# Route 53
- lower TTL before planned migrations when useful
- avoid deleting working records before replacement is validated
- document MX/TXT/SPF/DKIM/DMARC dependencies
- use alias records for supported AWS targets where appropriate
- verify DNS propagation and TLS dependencies after changes
