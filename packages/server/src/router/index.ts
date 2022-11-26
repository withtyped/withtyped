import RequestError from '../errors/RequestError.js';
import type { MiddlewareFunction } from '../middleware.js';
import type { RequestContext } from '../middleware/with-request.js';
import type { OpenAPIV3 } from '../openapi/openapi-types.js';
import type { RequestMethod } from '../request.js';
import { log } from '../utils.js';
import { buildOpenApiJson } from './openapi.js';
import type { RouteLike } from './route/index.js';
import Route from './route/index.js';
import type {
  BaseRoutes,
  GuardedContext,
  MergeRoutes,
  Normalized,
  NormalizedPrefix,
  Parser,
  PathGuard,
  RequestGuard,
  RoutesWithPrefix,
} from './types.js';
import { matchRoute } from './utils.js';

export * from './types.js';

export type MethodRoutesMap = Record<string, RouteLike[]>;

export type RouterWithRoute<
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
      ? Routes[method] & {
          [path in Path as Normalized<`${Prefix}${Path}`>]: PathGuard<Path, Search, Body, Response>;
        }
      : Routes[method];
  },
  Prefix
>;

export type BuildRoute<
  Routes extends BaseRoutes,
  Prefix extends string,
  Method extends Lowercase<RequestMethod>
> = <Path extends string, Search, Body, Response>(
  path: Normalized<Path>,
  guard: RequestGuard<Search, Body, Response>,
  run: MiddlewareFunction<
    GuardedContext<RequestContext, Normalized<Path>, Search, Body>,
    GuardedContext<RequestContext, Normalized<Path>, Search, Body> & {
      json?: Response;
    }
  >
) => RouterWithRoute<Routes, Prefix, Method, Normalized<Path>, Search, Body, Response>;

type BaseRouter<Routes extends BaseRoutes, Prefix extends string> = {
  [key in Lowercase<RequestMethod>]: BuildRoute<Routes, Prefix, key>;
};

export default class Router<Routes extends BaseRoutes = BaseRoutes, Prefix extends string = ''>
  implements BaseRouter<Routes, Prefix>
{
  // Use the dumb way to init since it's easier to make the compiler happy
  get = this.buildRoute('get');
  post = this.buildRoute('post');
  put = this.buildRoute('put');
  patch = this.buildRoute('patch');
  delete = this.buildRoute('delete');
  copy = this.buildRoute('copy');
  head = this.buildRoute('head');
  options = this.buildRoute('options');

  public readonly prefix: string;
  protected readonly routesMap: MethodRoutesMap = {};

  /**
   * Create a router instance.
   */
  constructor();
  /**
   * Create a router instance with a normalized prefix:
   * - Start with `/`, but not end with `/`
   * - Have NO continuous `/`, e.g. `/foo//bar`
   * - Have NO path parameter, e.g. `/:foo`
   */
  // By design. To provider a better hint.
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  constructor(prefix: NormalizedPrefix<Prefix>);
  constructor(prefix?: NormalizedPrefix<Prefix>) {
    if (prefix && (prefix.endsWith('/') || prefix.includes('//') || prefix.includes(':'))) {
      throw new TypeError('Router prefix must be normalized with no parameter (colon)');
    }

    this.prefix = prefix ?? '';
  }

  public routes(): MiddlewareFunction<RequestContext> {
    return async (originalContext, next, http) => {
      const { request } = originalContext;

      // TODO: Consider best match instead of first match
      const route = this.routesMap[request.method?.toLowerCase() ?? '']?.find((route) =>
        matchRoute(route, request.url)
      );

      if (!route) {
        return next(originalContext);
      }

      log.debug('matched route', this.prefix, route.path);

      try {
        await route.runnable(
          originalContext,
          async (context) => {
            const responseGuard = route.guard.response;

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
          json: buildOpenApiJson(this.routesMap, parseSearch, parse, info),
        });
      }
    );
  }

  public pack<AnotherRoutes extends BaseRoutes>(
    another: Router<AnotherRoutes, string> // Don't care another prefix since routes are all prefixed
  ): Router<MergeRoutes<Routes, RoutesWithPrefix<AnotherRoutes, Prefix>>, Prefix> {
    for (const [method, routes] of Object.entries(another.routesMap)) {
      this.routesMap[method] = (this.routesMap[method] ?? []).concat(
        routes.map((instance) => instance.clone(this.prefix + instance.prefix))
      );
    }

    // Intended
    // eslint-disable-next-line no-restricted-syntax
    return this as Router<MergeRoutes<Routes, RoutesWithPrefix<AnotherRoutes, Prefix>>, Prefix>;
  }

  public findHandler<Method extends Lowercase<RequestMethod>>(
    method: Method,
    path: keyof Routes[Method]
  ) {
    const url = new URL(String(path), 'https://fake-url');

    return this.routesMap[method]?.find((route) => matchRoute(route, url));
  }

  private buildRoute<Method extends Lowercase<RequestMethod>>(
    method: Method
  ): BuildRoute<Routes, Prefix, Method> {
    return (path, guard, run) => {
      this.routesMap[method] = (this.routesMap[method] ?? []).concat(
        new Route(this.prefix, path, guard, run)
      );

      return this;
    };
  }
}
