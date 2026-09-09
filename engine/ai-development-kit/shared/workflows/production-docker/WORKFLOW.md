# Production Docker Generation Workflow

1. Analyze project stack.
2. Detect web/worker/scheduler roles.
3. Detect package manager/runtime versions.
4. Detect required build/native dependencies.
5. Generate production Dockerfile.
6. Generate dev compose separately if useful.
7. Add health checks.
8. Configure non-root runtime.
9. Add graceful shutdown.
10. Validate build.
11. Run safety review.
12. Document ECS/Fargate mapping.
