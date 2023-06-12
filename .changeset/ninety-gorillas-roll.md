---
"@withtyped/client": patch
---

fix Client types

- Use `any` for Client router context inference to avoid context conflict
  - E.g. a router with `AuthContext` will not be able to use its type in the Client generic
- Support Promise build in `headers` config
