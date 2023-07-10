# @withtyped/postgres

## 0.12.5

### Patch Changes

- b3b48dc: Add `.identifiable` to model and recognize its values in Postgres SQL
- Updated dependencies [b3b48dc]
  - @withtyped/server@0.12.5

## 0.12.4

### Patch Changes

- f269a41: Use transaction for initializer
- 364af05: Use optional chainning for result parsing

## 0.12.3

### Patch Changes

- 5483c1f: Support schema in initializer
- 42c851a: Escape identifiers

## 0.12.2

### Patch Changes

- bb96f24: Fix `Guarded` type and add comments
- Updated dependencies [bb96f24]
  - @withtyped/server@0.12.4

## 0.12.1

### Patch Changes

- c8ba298: Allow multiple middleware functions in routes
- Updated dependencies [c8ba298]
  - @withtyped/server@0.12.3
  - @withtyped/shared@0.2.2

## 0.12.0

### Patch Changes

- 81f1467: add "types" field for node "exports" to explicitly define type files
- Updated dependencies [81f1467]
- Updated dependencies [81f1467]
  - @withtyped/server@0.12.0
  - @withtyped/shared@0.2.1

## 0.11.0

### Patch Changes

- Updated dependencies [0017a81]
  - @withtyped/server@0.11.0

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

### Patch Changes

- Updated dependencies [8851348]
  - @withtyped/server@0.10.0

## 0.9.0

### Minor Changes

- e4748e0: support result key transform to camelCase

### Patch Changes

- Updated dependencies [e4748e0]
  - @withtyped/server@0.9.0

## 0.8.1

### Patch Changes

- 79bc2cb: add jsonb utils

## 0.8.0

### Minor Changes

- d877dc1: features

  - support transaction queries
  - support raw sql by adding `DangerousRaw` class

### Patch Changes

- Updated dependencies [d877dc1]
  - @withtyped/server@0.8.0
