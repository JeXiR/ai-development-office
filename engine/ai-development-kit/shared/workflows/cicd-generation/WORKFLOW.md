# CI/CD Generation Workflow

1. Analyze project stack.
2. Analyze package scripts/tests.
3. Detect existing CI.
4. Choose GitHub Actions or GitLab CI.
5. Build validation matrix.
6. Add security audit.
7. Add migration safety gate.
8. Add build/container steps.
9. Add deployment environment/gate.
10. Validate YAML/config.
11. Document secrets required by CI.
12. Keep deploy target-specific logic isolated.
