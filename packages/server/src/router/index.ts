import { normalize } from 'node:path';

import RequestError from '../errors/RequestError.js';
import type { MiddlewareFunction } from '../middleware.js';
import type { RequestContext } from '../middleware/with-request.js';
import type { OpenAPIV3 } from '../openapi/openapi-types.js';
import type { RequestMethod } from '../request.js';
import { log } from '../utils.js';
import { buildOpenApiJson } from './openapi.js';
import type {
  BaseRoutes,
  GuardedContext,
  MergeRoutes,
  Parser,
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
  Search,
  Body,
  Response
> = Router<{
  [method in keyof Routes]: method extends Method
    ? Routes[method] & { [path in Path]: PathGuard<Path, Search, Body, Response> }
    : Routes[method];
}>;

export type MethodHandler<Routes extends BaseRoutes, Method extends Lowercase<RequestMethod>> = <
  Path extends string,
  Search,
  Body,
  Response
>(
  path: Path,
  guard: RequestGuard<Search, Body, Response>,
  handler: MiddlewareFunction<
    GuardedContext<RequestContext, Path, Search, Body>,
    GuardedContext<RequestContext, Path, Search, Body> & { json?: Response }
  >
) => RouterWithHandler<Routes, Method, Path, Search, Body, Response>;

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

  protected readonly handlers: RouterHandlerMap;

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

  public routes<InputContext extends RequestContext>(): MiddlewareFunction<
    InputContext,
    InputContext
  > {
    return async (originalContext, next, http) => {
      const { request } = originalContext;

      // TODO: Consider best match instead of first match
      const handler = this.handlers[request.method?.toLowerCase() ?? '']?.find((handler) =>
        matchRoute(handler, request.url)
      );

      if (!handler) {
        return next(originalContext);
      }

      log.debug('matched handler', handler.path);

      try {
        await handler.run(
          originalContext,
          async (context) => {
            const responseGuard = handler.guard?.response;

            if (responseGuard) {
              responseGuard.parse(context.json);
            }

            return next({ ...context, status: context.status ?? (context.json ? 200 : 204) });
          },
          http
        );
      } catch (error: unknown) {
        if (error instanceof RequestError) {
          return next({
            ...originalContext,
            status: error.status,
            json: { message: error.message },
          });
        }

        throw error;
      }
    };
  }

  public withOpenApi(
    parseSearch: <T>(guard?: Parser<T>) => OpenAPIV3.ParameterObject[],
    parse: <T>(guard?: Parser<T>) => OpenAPIV3.SchemaObject,
    info?: OpenAPIV3.InfoObject
  ) {
    return this.get<'/openapi.json', unknown, unknown, OpenAPIV3.Document>(
      '/openapi.json',
      {},
      async (context, next) => {
        return next({
          ...context,
          json: buildOpenApiJson(this.handlers, parseSearch, parse, info),
        });
      }
    );
  }

  public merge<AnotherRoutes extends BaseRoutes>(another: Router<AnotherRoutes>) {
    for (const [method, handlers] of Object.entries(another.handlers)) {
      this.handlers[method] = (this.handlers[method] ?? []).concat(handlers);
    }

    // Intended
    // eslint-disable-next-line no-restricted-syntax
    return this as Router<MergeRoutes<Routes, AnotherRoutes>>;
  }

  public handlerFor<Method extends Lowercase<RequestMethod>>(
    method: Method,
    path: keyof Routes[Method]
  ) {
    return this.handlers[method]?.find(({ path: handlerPath }) => handlerPath === path);
  }

  private buildHandler<Method extends Lowercase<RequestMethod>>(
    method: Method
  ): MethodHandler<Routes, Method> {
    const handlers: RouteHandler[] = [];
    this.handlers[method] = handlers;

    return (path, guard, handler) => {
      // eslint-disable-next-line @silverhand/fp/no-mutating-methods
      handlers.push({
        path: normalize(path),
        guard,
        run: async (context, next, http) => {
          return handler(
            {
              ...context,
              request: {
                ...context.request,
                ...guardInput(path, context.request.url, context.request.body, guard),
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
