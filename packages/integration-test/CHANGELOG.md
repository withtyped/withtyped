# @withtyped/integration-test

## 0.7.25

### Patch Changes

- Updated dependencies [956ea15]
  - @withtyped/client@0.8.4

## 0.7.24

### Patch Changes

- Updated dependencies [0745bb1]
- Updated dependencies [0745bb1]
  - @withtyped/server@0.13.3
  - @withtyped/client@0.8.3
  - @withtyped/postgres@0.13.0

## 0.7.23

### Patch Changes

- Updated dependencies [81fac52]
  - @withtyped/server@0.13.2
  - @withtyped/client@0.8.2
  - @withtyped/postgres@0.13.0

## 0.7.22

### Patch Changes

- Updated dependencies [2482021]
  - @withtyped/server@0.13.1
  - @withtyped/client@0.8.1
  - @withtyped/postgres@0.13.0

## 0.7.21

### Patch Changes

- Updated dependencies [a8b304b]
  - @withtyped/client@0.8.0
  - @withtyped/server@0.13.0
  - @withtyped/postgres@0.13.0

## 0.7.20

### Patch Changes

- Updated dependencies [1e627c2]
  - @withtyped/postgres@0.12.8

## 0.7.19

### Patch Changes

- Updated dependencies [9b4fafe]
  - @withtyped/server@0.12.9
  - @withtyped/client@0.7.22
  - @withtyped/postgres@0.12.7

## 0.7.18

### Patch Changes

- Updated dependencies [901ab53]
  - @withtyped/client@0.7.21

## 0.7.17

### Patch Changes

- Updated dependencies [8d02b85]
- Updated dependencies [8fa3ce1]
  - @withtyped/server@0.12.8
  - @withtyped/postgres@0.12.7
  - @withtyped/client@0.7.20

## 0.7.16

### Patch Changes

- Updated dependencies [321c627]
  - @withtyped/server@0.12.7
  - @withtyped/client@0.7.19
  - @withtyped/postgres@0.12.6

## 0.7.15

### Patch Changes

- Updated dependencies [aece9eb]
  - @withtyped/postgres@0.12.6
  - @withtyped/server@0.12.6
  - @withtyped/client@0.7.18

## 0.7.14

### Patch Changes

- Updated dependencies [f8b7736]
  - @withtyped/client@0.7.17

## 0.7.13

### Patch Changes

- Updated dependencies [b3b48dc]
- Updated dependencies [118e63d]
  - @withtyped/postgres@0.12.5
  - @withtyped/server@0.12.5
  - @withtyped/client@0.7.16

## 0.7.12

### Patch Changes

- Updated dependencies [f269a41]
- Updated dependencies [364af05]
  - @withtyped/postgres@0.12.4

## 0.7.11

### Patch Changes

- Updated dependencies [5483c1f]
- Updated dependencies [42c851a]
  - @withtyped/postgres@0.12.3

## 0.7.10

### Patch Changes

- Updated dependencies [bb96f24]
  - @withtyped/postgres@0.12.2
  - @withtyped/server@0.12.4
  - @withtyped/client@0.7.15

## 0.7.9

### Patch Changes

- Updated dependencies [c8ba298]
  - @withtyped/postgres@0.12.1
  - @withtyped/client@0.7.14
  - @withtyped/server@0.12.3
  - @withtyped/shared@0.2.2

## 0.7.8

### Patch Changes

- Updated dependencies [0edf34b]
  - @withtyped/server@0.12.2
  - @withtyped/client@0.7.13
  - @withtyped/postgres@0.12.0

## 0.7.7

### Patch Changes

- Updated dependencies [0ec9abc]
  - @withtyped/server@0.12.1
  - @withtyped/client@0.7.12
  - @withtyped/postgres@0.12.0

## 0.7.6

### Patch Changes

- Updated dependencies [81f1467]
- Updated dependencies [81f1467]
  - @withtyped/postgres@0.13.0
  - @withtyped/client@0.7.11
  - @withtyped/server@0.12.0
  - @withtyped/shared@0.2.1

## 0.7.5

### Patch Changes

- Updated dependencies [cf19a18]
  - @withtyped/client@0.7.10

## 0.7.4

### Patch Changes

- Updated dependencies [b942d71]
  - @withtyped/client@0.7.9

## 0.7.3

### Patch Changes

- Updated dependencies [8548019]
  - @withtyped/server@0.11.1
  - @withtyped/client@0.7.8
  - @withtyped/postgres@0.11.0

## 0.7.2

### Patch Changes

- Updated dependencies [0017a81]
  - @withtyped/server@0.11.0
  - @withtyped/client@0.7.7
  - @withtyped/postgres@0.13.0

## 0.7.1

### Patch Changes

- Updated dependencies [5e4405e]
  - @withtyped/server@0.10.1
  - @withtyped/client@0.7.6
  - @withtyped/postgres@0.10.0

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
  - @withtyped/postgres@0.13.0
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
