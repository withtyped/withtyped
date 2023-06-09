---
"@withtyped/server": patch
---

Model improvements

- Correct guard Zod types.
- Supports setting readonly when there is a database default value available.
- Use partial override for extend configs instead of replace.
- Add `.guard()` alias for `.getGuard()`.
