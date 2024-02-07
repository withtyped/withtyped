---
"@withtyped/client": minor
"@withtyped/server": minor
---

support general middleware

Use route's `.use()` method to add a general middleware that will be executed for all requests to the route.

```ts
import { createRouter } from '@withtyped/server';

const router = createRouter()
  .use(async (context, next) => next({ ...context, foo: 'bar' }))
  .get('/foo', async (context) => context.foo); // 'bar'
```

> [!Note]
> The `.use()` call must be placed before the route's method call (e.g. `.get()`) for type clarity. If you place it after, an error will be thrown.
