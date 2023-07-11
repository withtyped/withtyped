import type { Router, BaseRoutes, GuardedPayload, GuardedResponse } from '@withtyped/server';
import type { RequestMethod } from '@withtyped/shared';

export type {
  BaseRoutes,
  Guarded,
  GuardedPayload,
  GuardedResponse,
  PathGuard,
  RequestGuard,
} from '@withtyped/server';

export type ClientPayload = {
  params?: Record<string, string>;
  search?: Record<string, string | string[]>;
  body?: unknown;
};

/**
 * Infer the routes type of a router. The result will be `never` if a non-router type is given.
 * @see {@link Router}
 */
export type RouterRoutes<RouterInstance> = RouterInstance extends Router<
  infer _,
  infer Routes,
  string
>
  ? Routes
  : never;

/** Extract the routes that have empty payload from a method routes type. */
export type EmptyPayloadRoutes<MethodRoutes> = {
  [K in keyof MethodRoutes]: keyof GuardedPayload<MethodRoutes[K]> extends never ? K : never;
}[keyof MethodRoutes];

export type ClientRequestHandler<MethodRoutes> = <T extends keyof MethodRoutes>(
  ...args: T extends EmptyPayloadRoutes<MethodRoutes>
    ? [path: T]
    : [path: T, payload: GuardedPayload<MethodRoutes[T]>]
) => Promise<GuardedResponse<MethodRoutes[T]>>;

export type RouterClient<Routes extends BaseRoutes> = {
  [key in Lowercase<RequestMethod>]: ClientRequestHandler<Routes[key]>;
};

// Use `any` here for compatibility. The final type can be correctly inferred.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CanBePromise<T extends (...args: any[]) => any> =
  | T
  | ((...args: Parameters<T>) => Promise<ReturnType<T>>);

export type HeadersOption =
  | Record<string, string>
  | CanBePromise<
      (url: URL, method: Lowercase<RequestMethod>) => Record<string, string> | undefined
    >;

export type ClientConfig = {
  baseUrl: URL;
  headers?: HeadersOption;
};

export type ClientConfigInit = {
  /** Base URL to prepend for every request. Only origin and pathname will be applied. */
  baseUrl: string | URL;
  /** Additional headers to append for every request, also accepts a function that returns headers. */
  headers?: HeadersOption;
};

export { RequestMethod } from '@withtyped/shared';
