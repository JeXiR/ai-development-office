# Feature Contract & Completeness Engine

Turns incomplete feature intent into an explicit expected surface.

Example: `API key management` can resolve to List, Create, View, Edit, Delete/Revoke, Validation, Authorization, API contract, Error handling and Tests.

Optional/ambiguous capabilities use `decision_required`; they are never silently invented.

Artifacts:
- `.ai-kit/feature-contracts.json`
- `.ai-kit/feature-decisions.json`
- `.ai-kit/office-feature-contracts.json`
