# @withtyped/integration-test

## 0.7.0

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
  - @withtyped/postgres@1.0.0
  - @withtyped/server@0.10.0
  - @withtyped/client@0.7.5

## 0.6.5

### Patch Changes

- Updated dependencies [e4748e0]
- Updated dependencies [e4748e0]
  - @withtyped/server@0.9.0
  - @withtyped/postgres@0.9.0
  - @withtyped/client@0.7.4

## 0.6.4

### Patch Changes

- Updated dependencies [82a15a5]
  - @withtyped/server@0.8.2
  - @withtyped/client@0.7.3
  - @withtyped/postgres@0.8.1

## 0.6.3

### Patch Changes

- Updated dependencies [24a4b3b]
  - @withtyped/server@0.8.1
  - @withtyped/client@0.7.2
  - @withtyped/postgres@0.8.1

## 0.6.2

### Patch Changes

- Updated dependencies [79bc2cb]
  - @withtyped/postgres@0.8.1

## 0.6.1

### Patch Changes

- Updated dependencies [d877dc1]
  - @withtyped/postgres@0.8.0
  - @withtyped/server@0.8.0
  - @withtyped/client@0.7.1
