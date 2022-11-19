import url from 'node:url';

import type { BaseContext, MiddlewareFunction } from '../middleware.js';
import { color } from '../middleware/with-system-log.js';
import type { RequestMethod } from '../request.js';
import type {
  BaseRoutes,
  GuardedContext,
  PathGuard,
  RequestGuard,
  RouteHandler,
  RouterHandlerMap,
} from './types.js';
import { guardInput, matchRoute } from './utils.js';

export * from './types.js';

export type RouterWithHandler<
  Routes extends BaseRoutes,
  Method extends Lowercase<RequestMethod>,
  Path extends string,
  Query,
  Body,
  Response
> = Router<{
  [key in keyof Routes]: key extends Method
    ? Routes[key] & { [key in Path]: PathGuard<Path, Query, Body, Response> }
    : Routes[key];
}>;

export type MethodHandler<Routes extends BaseRoutes, Method extends Lowercase<RequestMethod>> = <
  Path extends string,
  Query,
  Body,
  Response
>(
  path: Path,
  guard: RequestGuard<Query, Body, Response>,
  handler: MiddlewareFunction<
    GuardedContext<BaseContext, Path, Query, Body>,
    GuardedContext<BaseContext, Path, Query, Body> & { json?: Response }
  >
) => RouterWithHandler<Routes, Method, Path, Query, Body, Response>;

type BaseRouter<Routes extends BaseRoutes> = {
  [key in Lowercase<RequestMethod>]: MethodHandler<Routes, key>;
};

export default class Router<Routes extends BaseRoutes = BaseRoutes> implements BaseRouter<Routes> {
  get: MethodHandler<Routes, 'get'>;
  post: MethodHandler<Routes, 'post'>;
  put: MethodHandler<Routes, 'put'>;
  patch: MethodHandler<Routes, 'patch'>;
  delete: MethodHandler<Routes, 'delete'>;
  copy: MethodHandler<Routes, 'copy'>;
  head: MethodHandler<Routes, 'head'>;
  options: MethodHandler<Routes, 'options'>;

  private readonly handlers: RouterHandlerMap;

  constructor() {
    // Use the dumb way to init since:
    // 1. Easier to make the compiler happy
    // 2. `this.handlers` needs to be initialized before handler methods

    this.handlers = {};
    this.get = this.buildHandler('get');
    this.post = this.buildHandler('post');
    this.put = this.buildHandler('put');
    this.patch = this.buildHandler('patch');
    this.delete = this.buildHandler('delete');
    this.copy = this.buildHandler('copy');
    this.head = this.buildHandler('head');
    this.options = this.buildHandler('options');
  }

  public routes<InputContext extends BaseContext>(): MiddlewareFunction<
    InputContext,
    InputContext
  > {
    return async (context, next, http) => {
      const { request } = http;

      // TODO: Consider best match instead of first match
      const handler = this.handlers[request.method?.toLowerCase() ?? '']?.find((handler) =>
        matchRoute(handler, request)
      );

      if (!handler) {
        return next(context);
      }

      console.log(color('dbg', 'dim'), 'matched handler', handler.path);

      return handler.run(
        context,
        async (context) => {
          const responseGuard = handler.guard?.response;

          if (responseGuard) {
            responseGuard.parse(context.json);
          }

          return next({ ...context, status: context.status ?? (context.json ? 200 : 204) });
        },
        http
      );
    };
  }

  private buildHandler<Method extends Lowercase<RequestMethod>>(
    method: Method
  ): MethodHandler<Routes, Method> {
    const handlers: RouteHandler[] = [];
    this.handlers[method] = handlers;

    return (path, guard, handler) => {
      // eslint-disable-next-line @silverhand/fp/no-mutating-methods
      handlers.push({
        path,
        guard,
        run: async (context, next, http) => {
          return handler(
            {
              ...context,
              request: {
                ...context.request,
                ...guardInput(
                  path,
                  url.parse(http.request.url ?? '', true),
                  context.request?.body,
                  guard
                ),
              },
            },
            // eslint-disable-next-line no-restricted-syntax
            next as Parameters<typeof handler>[1],
            http
          );
        },
      });

      // eslint-disable-next-line no-restricted-syntax
      return this as ReturnType<MethodHandler<Routes, Method>>;
    };
  }
}
