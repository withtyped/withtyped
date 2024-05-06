# @withtyped/client

## 0.8.7

### Patch Changes

- Updated dependencies [89314e4]
  - @withtyped/server@0.13.6

## 0.8.6

### Patch Changes

- Updated dependencies [8b123a7]
  - @withtyped/server@0.13.5

## 0.8.5

### Patch Changes

- Updated dependencies [dabf274]
  - @withtyped/server@0.13.4

## 0.8.4

### Patch Changes

- 956ea15: export `RouterRoutes` from server

## 0.8.3

### Patch Changes

- Updated dependencies [0745bb1]
- Updated dependencies [0745bb1]
  - @withtyped/server@0.13.3

## 0.8.2

### Patch Changes

- Updated dependencies [81fac52]
  - @withtyped/server@0.13.2

## 0.8.1

### Patch Changes

- Updated dependencies [2482021]
  - @withtyped/server@0.13.1

## 0.8.0

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

### Patch Changes

- Updated dependencies [a8b304b]
  - @withtyped/server@0.13.0

## 0.7.22

### Patch Changes

- Updated dependencies [9b4fafe]
  - @withtyped/server@0.12.9

## 0.7.21

### Patch Changes

- 901ab53: support before error hook

## 0.7.20

### Patch Changes

- Updated dependencies [8d02b85]
  - @withtyped/server@0.12.8

## 0.7.19

### Patch Changes

- Updated dependencies [321c627]
  - @withtyped/server@0.12.7

## 0.7.18

### Patch Changes

- Updated dependencies [aece9eb]
  - @withtyped/server@0.12.6

## 0.7.17

### Patch Changes

- f8b7736: Export more types

## 0.7.16

### Patch Changes

- 118e63d: Refine client request handler type
- Updated dependencies [b3b48dc]
  - @withtyped/server@0.12.5

## 0.7.15

### Patch Changes

- Updated dependencies [bb96f24]
  - @withtyped/server@0.12.4

## 0.7.14

### Patch Changes

- c8ba298: Allow multiple middleware functions in routes
- Updated dependencies [c8ba298]
  - @withtyped/server@0.12.3
  - @withtyped/shared@0.2.2

## 0.7.13

### Patch Changes

- Updated dependencies [0edf34b]
  - @withtyped/server@0.12.2

## 0.7.12

### Patch Changes

- Updated dependencies [0ec9abc]
  - @withtyped/server@0.12.1

## 0.7.11

### Patch Changes

- 81f1467: add "types" field for node "exports" to explicitly define type files
- Updated dependencies [81f1467]
- Updated dependencies [81f1467]
  - @withtyped/server@0.12.0
  - @withtyped/shared@0.2.1

## 0.7.10

### Patch Changes

- cf19a18: loose RouterRoutes generic input to avoid type conflict

## 0.7.9

### Patch Changes

- b942d71: fix Client types

  - Use `any` for Client router context inference to avoid context conflict
    - E.g. a router with `AuthContext` will not be able to use its type in the Client generic
  - Support Promise build in `headers` config

## 0.7.8

### Patch Changes

- Updated dependencies [8548019]
  - @withtyped/server@0.11.1

## 0.7.7

### Patch Changes

- Updated dependencies [0017a81]
  - @withtyped/server@0.11.0

## 0.7.6

### Patch Changes

- Updated dependencies [5e4405e]
  - @withtyped/server@0.10.1

## 0.7.5

### Patch Changes

- Updated dependencies [8851348]
  - @withtyped/server@0.10.0

## 0.7.4

### Patch Changes

- Updated dependencies [e4748e0]
  - @withtyped/server@0.9.0

## 0.7.3

### Patch Changes

- Updated dependencies [82a15a5]
  - @withtyped/server@0.8.2

## 0.7.2

### Patch Changes

- Updated dependencies [24a4b3b]
  - @withtyped/server@0.8.1

## 0.7.1

### Patch Changes

- Updated dependencies [d877dc1]
  - @withtyped/server@0.8.0
