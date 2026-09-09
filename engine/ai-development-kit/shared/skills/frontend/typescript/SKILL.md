---
name: typescript
description: Use TypeScript as a correctness tool with explicit domain contracts and minimal unsafe escapes.
---

# TypeScript

- Prefer precise types over `any`.
- Use `unknown` for untrusted values until validated.
- Infer local implementation details when obvious; type public boundaries explicitly.
- Model state with discriminated unions when mutually exclusive states exist.
- Avoid non-null assertions unless a proven invariant exists.
- Keep runtime validation at trust boundaries; TypeScript does not validate network/database input by itself.
