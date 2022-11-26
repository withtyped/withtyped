import type { MergeRequestContext, RequestContext } from '../middleware/with-request.js';
import type { RequestMethod } from '../request.js';

export type MergeRoutes<A, B> = {
  [key in keyof (A | B)]: key extends keyof B ? A[key] & B[key] : A[key];
};
export type Parser<T> = {
  parse: (data: unknown) => T;
};

/* eslint-disable @typescript-eslint/ban-types */
export type BaseRoutes = {
  [key in Lowercase<RequestMethod>]: {};
};
/* eslint-enable @typescript-eslint/ban-types */

// <Start> Normalize pathname

export type Normalized<T> = T extends `${string}//${string}`
  ? never
  : T extends `/${string}`
  ? T
  : never;

export type NormalizedPrefix<T> = T extends `${string}:${string}`
  ? never
  : T extends `${string}/`
  ? never
  : Normalized<T>;

type NormalizePath<Path extends string> = Path extends `/${infer A}`
  ? NormalizePath<A>
  : Path extends `${infer A}/${infer B}`
  ? `${A}/${NormalizePath<B>}`
  : Path;

type TrimEndSlash<Path extends string> = Path extends '/'
  ? Path
  : Path extends `${infer A}/`
  ? A
  : Path;

// Should we test type `NormalizePathname` and function `normalizePathname()` equality?
export type NormalizePathname<Path extends string> = `/${TrimEndSlash<NormalizePath<Path>>}`;

// <End>

export type RoutesWithPrefix<Routes extends BaseRoutes, Prefix extends string> = {
  [method in keyof BaseRoutes]: {
    [key in keyof Routes[method] as key extends string
      ? TrimEndSlash<`${Prefix}${key}`> // Both `Prefix` and `key` are normalized
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
  search: Search;
  body: Body;
};

export type GuardedContext<
  InputContext extends RequestContext,
  Path extends string,
  Search,
  Body
> = MergeRequestContext<InputContext, Guarded<Path, Search, Body>>;

export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;
