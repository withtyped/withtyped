---
"@withtyped/server": patch
---

- fix router `.pack()` type, now the other router's type is `Router<InputContext, InputContext, AnotherRoutes, string>`
- fix `CreateRouter` type, now it returns `Router<InputContext, InputContext>` when no prefix is provided
- router handler now responds with the parsed json instead of the original object from the context
