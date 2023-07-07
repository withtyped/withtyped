import type { RequestMethod } from '@withtyped/shared';

import type { RequestContext } from '../middleware/with-request.js';
import type { Parser } from '../types.js';

export type MergeRoutes<A, B> = {
  [key in keyof (A & B)]: key extends keyof (A | B)
    ? A[key] & B[key]
    : key extends keyof B
    ? B[key]
    : key extends keyof A
    ? A[key]
    : never;
};

/* eslint-disable @typescript-eslint/ban-types */
export type BaseRoutes = {
  [key in Lowercase<RequestMethod>]: {};
};
/* eslint-enable @typescript-eslint/ban-types */

export type Normalized<T> = T extends `${string}//${string}`
  ? never
  : T extends `/${string}`
  ? TrimEndSlash<T>
  : never;

export type NormalizedPrefix<T> = T extends `${string}:${string}`
  ? never
  : T extends `${string}/`
  ? never
  : Normalized<T>;

type TrimEndSlash<Path extends string> = Path extends '/'
  ? Path
  : Path extends `${infer A}/`
  ? A
  : Path;

export type RoutesWithPrefix<Routes extends BaseRoutes, Prefix extends string> = {
  [method in keyof BaseRoutes]: {
    [key in keyof Routes[method] as key extends string
      ? // Both `Prefix` and `key` are normalized, but `key` may be a single `/` for the root route (need to trim)
        TrimEndSlash<`${Prefix}${key}`>
      : never]: Routes[method][key];
  };
};

export type IsParameter<Part> = Part extends `:${infer Name}` ? Name : never;

export type Parts<Path extends string> = Path extends `/${infer A}`
  ? Parts<A>
  : Path extends `${infer A}/${infer B}`
  ? IsParameter<A> | Parts<B>
  : IsParameter<Path>;

export type Params<Path extends string> = {
  [key in Parts<Path>]: string;
};

export type RequestGuard<Search, Body, Response> = {
  search?: Parser<Search>;
  body?: Parser<Body>;
  response?: Parser<Response>;
};

export type PathGuard<Path extends string, Search, Body, Response> = RequestGuard<
  Search,
  Body,
  Response
> & {
  params: Parser<Params<Path>>;
};

// Mapped type `as` clauses https://github.com/microsoft/TypeScript/pull/40336
export type RemoveUsedKeys<T> = {
  [key in keyof T as keyof T[key] extends never ? never : key]: T[key];
};

export type GuardedPayload<T> = T extends PathGuard<infer Path, infer Search, infer Body, unknown>
  ? RemoveUsedKeys<{
      params: Params<Path>;
      search: Search;
      body: Body;
    }>
  : never;

export type GuardedResponse<T> = T extends PathGuard<string, unknown, unknown, infer Response>
  ? Response
  : never;

export type Guarded<Path extends string, Search, Body> = {
  params: Params<Path>;
  /**
   * Fall back to `unknown` if `Search` or `Body` are `never` (i.e. not provided).
   * This conditional type is necessary because in routes with no search or body,
   * `Search` and `Body` will be `never` but the TypeScript compiler will infer the
   * middleware function to have `unknown` for the `search` and `body` properties.
   *
   * @see {@link https://stackoverflow.com/a/65492934/12514940 | StackOverflow} for why using `[Search] extends [never]` instead of `Search extends never`.
   */
  search: [Search] extends [never] ? unknown : Search;
  /**
   * Fall back to `unknown` if `Search` or `Body` are `never` (i.e. not provided).
   * This conditional type is necessary because in routes with no search or body,
   * `Search` and `Body` will be `never` but the TypeScript compiler will infer the
   * middleware function to have `unknown` for the `search` and `body` properties.
   *
   * * @see {@link https://stackoverflow.com/a/65492934/12514940 | StackOverflow} for why using `[Body] extends [never]` instead of `Body extends never`.
   */
  body: [Body] extends [never] ? unknown : Body;
};

export type GuardedContext<
  InputContext extends RequestContext,
  Path extends string,
  Search,
  Body
> = InputContext & { guarded: Guarded<Path, Search, Body> };

export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;
