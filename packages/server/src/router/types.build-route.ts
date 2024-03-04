import type { RequestMethod } from '@withtyped/shared';

import type { RequestContext } from '../middleware/with-request.js';
import type { BaseContext, MiddlewareFunction } from '../middleware.js';

import type Router from './index.js';
import type { BaseRoutes, GuardedContext, Normalized, PathGuard, RequestGuard } from './types.js';

export type RouterWithRoute<
  PreInputContext extends RequestContext,
  InputContext extends RequestContext,
  Routes extends BaseRoutes,
  Prefix extends string,
  Method extends Lowercase<RequestMethod>,
  Path extends string,
  Search,
  Body,
  JsonResponse,
> = Router<
  PreInputContext,
  InputContext,
  {
    [method in Lowercase<RequestMethod>]: method extends Method
      ? Routes[method] & {
          [path in Path as Normalized<`${Prefix}${Path}`>]: PathGuard<
            Path,
            Search,
            Body,
            JsonResponse
          >;
        }
      : Routes[method];
  },
  Prefix
>;

/**
 * Due to TypeScript limitations, we can't use a generic middleware function array
 * for the `run` parameter of `buildRoute`. Instead, we have to overload the
 * function for each number of middleware functions.
 */
export type BuildRoute<
  PreInputContext extends RequestContext,
  InputContext extends RequestContext,
  Routes extends BaseRoutes,
  Prefix extends string,
  Method extends Lowercase<RequestMethod>,
> = {
  <Path extends string, Search, Body, JsonResponse>(
    path: Path extends Normalized<Path> ? Path : never,
    guard: RequestGuard<Search, Body, JsonResponse>,
    run: MiddlewareFunction<
      GuardedContext<InputContext, Path extends Normalized<Path> ? Path : never, Search, Body>,
      InputContext & {
        json?: JsonResponse;
      }
    >
  ): RouterWithRoute<
    PreInputContext,
    InputContext,
    Routes,
    Prefix,
    Method,
    Normalized<Path>,
    Search,
    Body,
    JsonResponse
  >;
  <Path extends string, Search, Body, JsonResponse, C1 extends BaseContext>(
    path: Path extends Normalized<Path> ? Path : never,
    guard: RequestGuard<Search, Body, JsonResponse>,
    run_1: MiddlewareFunction<
      GuardedContext<InputContext, Path extends Normalized<Path> ? Path : never, Search, Body>,
      C1
    >,
    run_2: MiddlewareFunction<
      C1,
      InputContext & {
        json?: JsonResponse;
      }
    >
  ): RouterWithRoute<
    PreInputContext,
    InputContext,
    Routes,
    Prefix,
    Method,
    Normalized<Path>,
    Search,
    Body,
    JsonResponse
  >;
  <Path extends string, Search, Body, JsonResponse, C1 extends BaseContext, C2 extends BaseContext>(
    path: Path extends Normalized<Path> ? Path : never,
    guard: RequestGuard<Search, Body, JsonResponse>,
    run_1: MiddlewareFunction<
      GuardedContext<InputContext, Path extends Normalized<Path> ? Path : never, Search, Body>,
      C1
    >,
    run_2: MiddlewareFunction<C1, C2>,
    run_3: MiddlewareFunction<
      C2,
      InputContext & {
        json?: JsonResponse;
      }
    >
  ): RouterWithRoute<
    PreInputContext,
    InputContext,
    Routes,
    Prefix,
    Method,
    Normalized<Path>,
    Search,
    Body,
    JsonResponse
  >;
  <
    Path extends string,
    Search,
    Body,
    JsonResponse,
    C1 extends BaseContext,
    C2 extends BaseContext,
    C3 extends BaseContext,
  >(
    path: Path extends Normalized<Path> ? Path : never,
    guard: RequestGuard<Search, Body, JsonResponse>,
    run_1: MiddlewareFunction<
      GuardedContext<InputContext, Path extends Normalized<Path> ? Path : never, Search, Body>,
      C1
    >,
    run_2: MiddlewareFunction<C1, C2>,
    run_3: MiddlewareFunction<C2, C3>,
    run_4: MiddlewareFunction<
      C3,
      InputContext & {
        json?: JsonResponse;
      }
    >
  ): RouterWithRoute<
    PreInputContext,
    InputContext,
    Routes,
    Prefix,
    Method,
    Normalized<Path>,
    Search,
    Body,
    JsonResponse
  >;
  <
    Path extends string,
    Search,
    Body,
    JsonResponse,
    C1 extends BaseContext,
    C2 extends BaseContext,
    C3 extends BaseContext,
    C4 extends BaseContext,
  >(
    path: Path extends Normalized<Path> ? Path : never,
    guard: RequestGuard<Search, Body, JsonResponse>,
    run_1: MiddlewareFunction<
      GuardedContext<InputContext, Path extends Normalized<Path> ? Path : never, Search, Body>,
      C1
    >,
    run_2: MiddlewareFunction<C1, C2>,
    run_3: MiddlewareFunction<C2, C3>,
    run_4: MiddlewareFunction<C3, C4>,
    run_5: MiddlewareFunction<
      C4,
      InputContext & {
        json?: JsonResponse;
      }
    >
  ): RouterWithRoute<
    PreInputContext,
    InputContext,
    Routes,
    Prefix,
    Method,
    Normalized<Path>,
    Search,
    Body,
    JsonResponse
  >;
};
