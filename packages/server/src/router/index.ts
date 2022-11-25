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
  RouterHandlerMap,
  RoutesWithPrefix,
} from './types.js';
import { guardInput, matchRoute } from './utils.js';

export * from './types.js';

export type RouterWithHandler<
  Routes extends BaseRoutes,
  Prefix extends string,
  Method extends Lowercase<RequestMethod>,
  Path extends string,
  Search,
  Body,
  Response
> = Router<
  {
    [method in keyof Routes]: method extends Method
      ? Routes[method] & { [path in `${Prefix}${Path}`]: PathGuard<Path, Search, Body, Response> }
      : Routes[method];
  },
  Prefix
>;

export type MethodHandler<
  Routes extends BaseRoutes,
  Prefix extends string,
  Method extends Lowercase<RequestMethod>
> = <Path extends string, Search, Body, Response>(
  path: Path,
  guard: RequestGuard<Search, Body, Response>,
  handler: MiddlewareFunction<
    GuardedContext<RequestContext, `${Prefix}${Path}`, Search, Body>,
    GuardedContext<RequestContext, `${Prefix}${Path}`, Search, Body> & { json?: Response }
  >
) => RouterWithHandler<Routes, Prefix, Method, Path, Search, Body, Response>;

type BaseRouter<Routes extends BaseRoutes, Prefix extends string> = {
  [key in Lowercase<RequestMethod>]: MethodHandler<Routes, Prefix, key>;
};

export default class Router<Routes extends BaseRoutes = BaseRoutes, Prefix extends string = ''>
  implements BaseRouter<Routes, Prefix>
{
  // Use the dumb way to init since it's easier to make the compiler happy
  get = this.buildHandler('get');
  post = this.buildHandler('post');
  put = this.buildHandler('put');
  patch = this.buildHandler('patch');
  delete = this.buildHandler('delete');
  copy = this.buildHandler('copy');
  head = this.buildHandler('head');
  options = this.buildHandler('options');

  public readonly prefix: Prefix;
  protected readonly handlers: RouterHandlerMap = {};

  constructor(prefix?: Prefix) {
    // eslint-disable-next-line no-restricted-syntax
    this.prefix = (prefix ?? '') as Prefix;
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

  public pack<AnotherRoutes extends BaseRoutes>(
    another: Router<AnotherRoutes, string> // Don't care another prefix since routes are all prefixed
  ): Router<MergeRoutes<Routes, RoutesWithPrefix<AnotherRoutes, Prefix>>> {
    const { prefix } = this;

    for (const [method, handlers] of Object.entries(another.handlers)) {
      this.handlers[method] = (this.handlers[method] ?? []).concat(
        prefix
          ? handlers.map(({ path, ...rest }) => ({ ...rest, path: normalize(prefix + path) }))
          : handlers
      );
    }

    // Intended
    // eslint-disable-next-line no-restricted-syntax
    return this as Router<MergeRoutes<Routes, RoutesWithPrefix<AnotherRoutes, Prefix>>>;
  }

  public findHandler<Method extends Lowercase<RequestMethod>>(
    method: Method,
    path: keyof Routes[Method]
  ) {
    return this.handlers[method]?.find(({ path: handlerPath }) => handlerPath === path);
  }

  private buildHandler<Method extends Lowercase<RequestMethod>>(
    method: Method
  ): MethodHandler<Routes, Prefix, Method> {
    return (path, guard, handler) => {
      const handlers = this.handlers[method] ?? [];

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
                ...guardInput(
                  `${this.prefix}${path}` as const,
                  context.request.url,
                  context.request.body,
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
      this.handlers[method] = handlers;

      // eslint-disable-next-line no-restricted-syntax
      return this as ReturnType<MethodHandler<Routes, Prefix, Method>>;
    };
  }
}
