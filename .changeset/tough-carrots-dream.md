---
"@withtyped/server": patch
---

improve router's `.pack()` type, now it is compatible with "lower" context types

For example:
  
```ts
import { Router, type RequestContext } from '@withtyped/server'

type Context = RequestContext & { userId: string };

const router = new Router<Context>();
const anotherRouter = new Router<RequestContext>();

router.pack(anotherRouter); // it is ok now
```
