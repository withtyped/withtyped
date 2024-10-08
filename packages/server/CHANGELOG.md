# @withtyped/server

## 0.14.0

### Minor Changes

- d41bdb7: add error details to the RequestError body

  Append `RequestError` original error details to the error response body. This will help to provide more error context to the client.

## 0.13.6

### Patch Changes

- 89314e4: fix request id context injection

## 0.13.5

### Patch Changes

- 8b123a7: use `response.setHeader()` to set request id header

  This is to fix the `ERR_HTTP_HEADERS_SENT` issue when enabling the `requestId` feature. It happens when the response headers are sent directly without setting the `headers` property of the context object.

## 0.13.4

### Patch Changes

- dabf274: support request id

  Now it's possible to let the server generate a request id for you. This is useful for logging and debugging purposes.

  ```ts
  import { createServer } from "@withtyped/server";

  const server = createServer({
    requestId: {
      enabled: true,
      headerName: "some-header-name", // default is 'x-request-id'
    },
  });
  ```

## 0.13.3

### Patch Changes

- 0745bb1: forbid packing routers with middleware functions

  ```ts
  import { Router } from "@withtyped/server";

  const router = new Router();
  const anotherRouter = new Router().use(/* ... */);

  router.pack(anotherRouter); // throws an error
  ```

  This change is made to prevent packing routers with middleware functions, which is not supported and can lead to unexpected behavior.

- 0745bb1: improve router's `.pack()` type, now it is compatible with "lower" context types

  For example:

  ```ts
  import { Router, type RequestContext } from "@withtyped/server";

  type Context = RequestContext & { userId: string };

  const router = new Router<Context>();
  const anotherRouter = new Router<RequestContext>();

  router.pack(anotherRouter); // it is ok now
  ```

## 0.13.2

### Patch Changes

- 81fac52: fix `<RouterRoutes>` type inference

## 0.13.1

### Patch Changes

- 2482021: - fix router `.pack()` type, now the other router's type is `Router<InputContext, InputContext, AnotherRoutes, string>`
  - fix `CreateRouter` type, now it returns `Router<InputContext, InputContext>` when no prefix is provided
  - router handler now responds with the parsed json instead of the original object from the context

## 0.13.0

### Minor Changes

- a8b304b: support general middleware

  Use route's `.use()` method to add a general middleware that will be executed for all requests to the route.

  ```ts
  import { createRouter } from "@withtyped/server";

  const router = createRouter()
    .use(async (context, next) => next({ ...context, foo: "bar" }))
    .get("/foo", async (context) => context.foo); // 'bar'
  ```

  > [!Note]
  > The `.use()` call must be placed before the route's method call (e.g. `.get()`) for type clarity. If you place it after, an error will be thrown.

## 0.12.9

### Patch Changes

- 9b4fafe: fix model boolean type inference

## 0.12.8

### Patch Changes

- 8d02b85: throw error when there is no response guard but a response json is provided

## 0.12.7

### Patch Changes

- 321c627: Inherit model schema and fix model key types after `.exclude()`

## 0.12.6

### Patch Changes

- aece9eb: Use global Symbol registry to increase compatibility when multiple @withtyped libraries exist

## 0.12.5

### Patch Changes

- b3b48dc: Add `.identifiable` to model and recognize its values in Postgres SQL

## 0.12.4

### Patch Changes

- bb96f24: Fix `Guarded` type and add comments

## 0.12.3

### Patch Changes

- c8ba298: Allow multiple middleware functions in routes
- Updated dependencies [c8ba298]
  - @withtyped/shared@0.2.2

## 0.12.2

### Patch Changes

- 0edf34b: Add `bodyRaw` buffer to context in `withBody()`

## 0.12.1

### Patch Changes

- 0ec9abc: Allow multiple items in `content-type` header

## 0.12.0

### Minor Changes

- 81f1467: BREAKING CHANGE: remove koaAdapter

### Patch Changes

- 81f1467: add "types" field for node "exports" to explicitly define type files
- Updated dependencies [81f1467]
  - @withtyped/shared@0.2.1

## 0.11.1

### Patch Changes

- 8548019: fix `.required()` Zod type

## 0.11.0

### Minor Changes

- 0017a81: separate model export to make model universally available

  Use `import {} from '@withtyped/server/model';` to import.

## 0.10.1

### Patch Changes

- 5e4405e: Model improvements

  - Correct guard Zod types.
  - Supports setting readonly when there is a database default value available.
  - Use partial override for extend configs instead of replace.
  - Add `.guard()` alias for `.getGuard()`.

## 0.10.0

### Minor Changes

- 8851348: Use Zod

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

## 0.9.0

### Minor Changes

- e4748e0: add common query methods with default implementation

## 0.8.2

### Patch Changes

- 82a15a5: improve RequestError and add essentials to dependency

## 0.8.1

### Patch Changes

- 24a4b3b: improve error handling to keep server running when request aborts

## 0.8.0

### Minor Changes

- d877dc1: features

  - support transaction queries
  - support raw sql by adding `DangerousRaw` class
