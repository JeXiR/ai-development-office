---
name: aws-lambda
description: Use AWS Lambda for suitable event-driven/serverless workloads without forcing long-running application patterns into functions.
---

# AWS Lambda
Good for bounded event-driven tasks, webhooks, transformations and scheduled lightweight jobs.
Avoid for workloads requiring long-lived processes, very large local state or unsuitable execution duration.
Keep functions idempotent where retries occur.
Use least-privilege execution roles.
Keep secrets out of code/packages.
