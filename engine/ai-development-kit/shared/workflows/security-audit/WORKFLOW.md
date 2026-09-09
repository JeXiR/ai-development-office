# Security Audit Workflow

1. Run secret scan.
2. Run dependency audit.
3. Inspect route/config posture.
4. Review authentication.
5. Review authorization/IDOR.
6. Review tenant isolation if applicable.
7. Review upload/storage paths if applicable.
8. Review CSRF/session/cookie/CORS/security headers.
9. Review logging/data exposure.
10. Produce severity-ranked report.
11. Fix CRITICAL/HIGH first.
12. Re-run audit and tests.
