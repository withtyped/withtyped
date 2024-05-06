---
"@withtyped/server": patch
---

support request id

Now it's possible to let the server generate a request id for you. This is useful for logging and debugging purposes.

```ts
import { createServer } from '@withtyped/server';

const server = createServer({
  requestId: {
    enabled: true,
    headerName: 'some-header-name', // default is 'x-request-id'
  }
});
```
