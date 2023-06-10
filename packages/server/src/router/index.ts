import type { RequestMethod } from '@withtyped/shared';
import { log } from '@withtyped/shared';

import RequestError from '../errors/RequestError.js';
import type { RequestContext } from '../middleware/with-request.js';
import type { MiddlewareFunction } from '../middleware.js';
import { ModelClientError } from '../model-client/errors.js';
import type { OpenAPIV3 } from '../openapi/openapi-types.js';
import type { Parser } from '../types.js';

import { buildOpenApiJson } from './openapi.js';
import type { RouteLike } from './route/index.js';
import Route from './route/index.js';
import type {
  BaseRoutes,
  GuardedContext,
  MergeRoutes,
  Normalized,
  NormalizedPrefix,
  PathGuard,
  RequestGuard,
  RoutesWithPrefix,
} from './types.js';
import { matchRoute } from './utils.js';

export * from './types.js';

export type MethodRoutesMap<InputContext extends RequestContext> = Record<
  string,
  Array<RouteLike<InputContext>>
>;

export type RouterWithRoute<
  InputContext extends RequestContext,
  Routes extends BaseRoutes,
  Prefix extends string,
  Method extends Lowercase<RequestMethod>,
  Path extends string,
  Search,
  Body,
  JsonResponse
> = Router<
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

export type BuildRoute<
  InputContext extends RequestContext,
  Routes extends BaseRoutes,
  Prefix extends string,
  Method extends Lowercase<RequestMethod>
> = <Path extends string, Search, Body, JsonResponse>(
  path: Path extends Normalized<Path> ? Path : never,
  guard: RequestGuard<Search, Body, JsonResponse>,
  run: MiddlewareFunction<
    GuardedContext<InputContext, Path extends Normalized<Path> ? Path : never, Search, Body>,
    InputContext & {
      json?: JsonResponse;
    }
  >
) => RouterWithRoute<
  InputContext,
  Routes,
  Prefix,
  Method,
  Normalized<Path>,
  Search,
  Body,
  JsonResponse
>;

type BaseRouter<
  InputContext extends RequestContext,
  Routes extends BaseRoutes,
  Prefix extends string
> = {
  [key in Lowercase<RequestMethod>]: BuildRoute<InputContext, Routes, Prefix, key>;
};

export type RouterRoutes<RouterInstance extends Router> = RouterInstance extends Router<
  infer _,
  infer Routes
>
  ? Routes
  : never;

export default class Router<
  InputContext extends RequestContext = RequestContext,
  Routes extends BaseRoutes = BaseRoutes,
  Prefix extends string = ''
> implements BaseRouter<InputContext, Routes, Prefix>
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
  protected readonly routesMap: MethodRoutesMap<InputContext> = {};

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

  public routes(): MiddlewareFunction<InputContext> {
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
        // TODO: Consider some better approach to decouple ModelClientError with Router
        if (error instanceof ModelClientError && error.code === 'entity_not_found') {
          throw new RequestError('Entity not found', 404);
        }

        throw error;
      }
    };
  }

  public withOpenApi(
    parseSearch?: <T>(guard?: Parser<T>) => OpenAPIV3.ParameterObject[],
    parse?: <T>(guard?: Parser<T>) => OpenAPIV3.SchemaObject,
    info?: Partial<OpenAPIV3.InfoObject>
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
    another: Router<InputContext, AnotherRoutes, string> // Don't care another prefix since routes are all prefixed
  ): Router<InputContext, MergeRoutes<Routes, RoutesWithPrefix<AnotherRoutes, Prefix>>, Prefix> {
    for (const [method, routes] of Object.entries(another.routesMap)) {
      this.routesMap[method] = (this.routesMap[method] ?? []).concat(
        routes.map((instance) => instance.clone(this.prefix + instance.prefix))
      );
    }

    // Intended
    // eslint-disable-next-line no-restricted-syntax
    return this as Router<
      InputContext,
      MergeRoutes<Routes, RoutesWithPrefix<AnotherRoutes, Prefix>>,
      Prefix
    >;
  }

  public findRoute<Method extends Lowercase<RequestMethod>>(
    method: Method,
    path: keyof Routes[Method]
  ) {
    const url = new URL(String(path), 'https://fake-url');

    return this.routesMap[method]?.find((route) => matchRoute(route, url));
  }

  private buildRoute<Method extends Lowercase<RequestMethod>>(
    method: Method
  ): BuildRoute<InputContext, Routes, Prefix, Method> {
    return (path, guard, run) => {
      this.routesMap[method] = (this.routesMap[method] ?? []).concat(
        new Route(this.prefix, path, guard, run)
      );

      // eslint-disable-next-line no-restricted-syntax
      return this as ReturnType<ReturnType<typeof this.buildRoute<Method>>>;
    };
  }
}

export type CreateRouter = {
  <InputContext extends RequestContext>(): Router<InputContext>;
  <InputContext extends RequestContext, Prefix extends string>(
    prefix: NormalizedPrefix<Prefix>
  ): Router<InputContext, BaseRoutes, NormalizedPrefix<Prefix>>;
};

export const createRouter: CreateRouter = <Prefix extends string>(
  prefix?: NormalizedPrefix<Prefix>
) => (prefix ? new Router(prefix) : new Router()); // To make TypeScript happy
