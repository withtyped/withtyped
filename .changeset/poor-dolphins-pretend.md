---
"@withtyped/server": patch
---

forbid packing routers with middleware functions

```ts
import { Router } from '@withtyped/server'

const router = new Router();
const anotherRouter = new Router().use(/* ... */);

router.pack(anotherRouter); // throws an error
```

This change is made to prevent packing routers with middleware functions, which is not supported and can lead to unexpected behavior.
