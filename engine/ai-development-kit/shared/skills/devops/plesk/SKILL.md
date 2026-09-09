---
name: plesk
description: Operate applications on Plesk while keeping deployment structure portable to Docker or cloud infrastructure.
---

# Plesk

Treat Plesk as a deployment environment, not an application architecture.

- Keep application config in environment/config files.
- Keep document root correct for framework.
- Separate cron/scheduler/queue worker responsibilities.
- Avoid manual server changes that cannot be reproduced/documented.
- Record custom PHP/Nginx/Apache settings.
- Back up before risky hosting-level migrations.
- Design storage/queues/database access so they can later move to managed services.
