---
name: aws-foundations
description: Design AWS deployments without coupling application business logic to AWS-specific infrastructure.
---

# AWS Foundations

## Default principle
AWS is an infrastructure implementation, not the domain architecture.

## Common mappings
- Object/file storage -> S3
- Relational database -> RDS/Aurora
- Container workloads -> ECS/Fargate
- VM workloads -> EC2
- CDN/static delivery -> CloudFront
- DNS -> Route 53
- Async messaging -> SQS/SNS/EventBridge
- Serverless workloads -> Lambda
- Secrets -> Secrets Manager / SSM Parameter Store
- Logs/metrics -> CloudWatch

## Requirements
- least-privilege IAM
- encryption in transit and at rest
- backups and restore strategy
- environment separation
- observability
- cost awareness
- infrastructure reproducibility
- no credentials committed to repositories
