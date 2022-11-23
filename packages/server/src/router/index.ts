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
    GuardedContext<RequestContext, Path, Query, Body>,
    GuardedContext<RequestContext, Path, Query, Body> & { json?: Response }
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

  public routes<InputContext extends RequestContext>(): MiddlewareFunction<
    InputContext,
    InputContext
  > {
    return async (context, next, http) => {
      const { request, json, status } = context;

      // TODO: Consider best match instead of first match
      const handler = this.handlers[request.method?.toLowerCase() ?? '']?.find((handler) =>
        matchRoute(handler, request.url)
      );

      if (!handler) {
        return next(context);
      }

      log.debug('matched handler', handler.path);

      try {
        await handler.run(
          context,
          async (context) => {
            const responseGuard = handler.guard?.response;

            if (responseGuard) {
              responseGuard.parse(json);
            }

            return next({ ...context, status: status ?? (json ? 200 : 204) });
          },
          http
        );
      } catch (error: unknown) {
        if (error instanceof RequestError) {
          return next({ ...context, status: error.status, json: { message: error.message } });
        }

        throw error;
      }
    };
  }

  public withOpenApi(
    parseQuery: <T>(guard?: Parser<T>) => OpenAPIV3.ParameterObject[],
    parse: <T>(guard?: Parser<T>) => OpenAPIV3.SchemaObject,
    info?: OpenAPIV3.InfoObject
  ) {
    return this.get<'/openapi.json', unknown, unknown, OpenAPIV3.Document>(
      '/openapi.json',
      {},
      async (context, next) => {
        return next({ ...context, json: buildOpenApiJson(this.handlers, parseQuery, parse, info) });
      }
    );
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
