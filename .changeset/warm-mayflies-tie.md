---
"@withtyped/integration-test": minor
"@withtyped/postgres": minor
"@withtyped/sample": minor
"@withtyped/server": minor
---

Use Zod

## Breaking changes

### Remove `ModelRouter`
Remove `ModelRouter` class and use Zod as the opinionated validation
library.

- The `ModelRouter` was a fantasy. In practice, it brought more troubles than benefits and it is anti-pattern somehow.
- Use an opinionated validation library could help us greatly reduce the compatibility work.

### Remove `isIdKey()` from model class

Not in use once `ModelRouter` has been removed.

## Update

- Rewrite and simplify model's `.parse()` using Zod.
- Add `.getGuard()` to get the Zod guard for a specific use ('model', 'create', or 'patch').
- Add type helpers and inline comments.
