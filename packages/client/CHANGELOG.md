# @withtyped/client

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
