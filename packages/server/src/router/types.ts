import type { HttpContext, NextFunction } from '../middleware.js';
import type { MergeRequestContext, RequestContext } from '../middleware/with-request.js';
import type { RequestMethod } from '../request.js';

export type Parser<T> = {
  parse: (data: unknown) => T;
};

/* eslint-disable @typescript-eslint/ban-types */
export type BaseRoutes = {
  [key in Lowercase<RequestMethod>]: {};
};
/* eslint-enable @typescript-eslint/ban-types */

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

export type RouteHandler = {
  path: string;
  guard?: RequestGuard<unknown, unknown, unknown>;
  run: <InputContext extends RequestContext, OutputContext extends RequestContext = InputContext>(
    context: InputContext,
    next: NextFunction<OutputContext>,
    http: HttpContext
  ) => Promise<void>;
};

export type RouterHandlerMap = Record<string, RouteHandler[]>;

export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;
