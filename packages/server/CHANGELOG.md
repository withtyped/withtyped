# @withtyped/server

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
