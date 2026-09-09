---
name: aws-ecs-fargate-iac
description: Provision ECS/Fargate workloads with networking, IAM roles, logging, health checks and deployment-safe configuration.
---

# ECS/Fargate IaC

Model:
- cluster
- task definition
- execution role
- task role
- service
- networking/security groups
- load balancer target group
- autoscaling
- log group
- secrets references

Separate web/worker/scheduler services when lifecycle differs.
