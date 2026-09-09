---
name: bundle-budget
description: Prevent frontend bundle growth through per-route and shared-chunk budgets.
---

# Bundle Budget

Check:
- initial JS
- route JS
- shared/vendor chunks
- duplicate dependencies
- large client-only packages
- animation/3D libraries
- locale bundles

Do not move everything server-side or remove needed UX merely to hit arbitrary numbers; fix real waste.
