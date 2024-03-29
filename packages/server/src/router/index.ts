import type { RequestMethod } from '@withtyped/shared';
import { log } from '@withtyped/shared';

import { createComposer } from '../compose.js';
import RequestError from '../errors/RequestError.js';
import type { RequestContext } from '../middleware/with-request.js';
import type { BaseContext, MiddlewareFunction } from '../middleware.js';
import { ModelClientError } from '../model-client/errors.js';
import type { OpenAPIV3 } from '../openapi/openapi-types.js';
import type { Parser } from '../types.js';

import { buildOpenApiJson } from './openapi.js';
import type { RouteLike } from './route/index.js';
import Route from './route/index.js';
import { type BuildRoute } from './types.build-route.js';
import type {
  BaseRoutes,
  MergeRoutes,
  Normalized,
  NormalizedPrefix,
  RequestGuard,
  RoutesWithPrefix,
} from './types.js';
import { matchRoute } from './utils.js';

export * from './types.js';
export const openApiRoute = '/openapi.json';

export type MethodRoutesMap<InputContext extends RequestContext> = Record<
  string,
  Array<RouteLike<InputContext>>
>;

type BaseRouter<
  PreInputContext extends RequestContext,
  InputContext extends RequestContext,
  Routes extends BaseRoutes,
  Prefix extends string,
> = {
  [key in Lowercase<RequestMethod>]: BuildRoute<PreInputContext, InputContext, Routes, Prefix, key>;
};

export type RouterRoutes<RouterInstance> =
  RouterInstance extends Router<
    infer _,
    infer __, // Use different names to avoid conflict since currently we cannot ignore inference. See https://github.com/microsoft/TypeScript/issues/26242
    infer Routes
  >
    ? Routes
    : never;

/**
 * WARNING: Don't use this function unless you know what you are doing.
 *
 * Compose an array of middleware functions into a single middleware function,
 * by filtering out all falsy values. This function does NOT check the type of
 * the input, so you should make sure the input is an array of middleware
 * functions, and manually specify the input and output context types.
 */
const composeArray = <InputContext extends BaseContext, OutputContext extends BaseContext>(
  ...runs: unknown[]
) => {
  return createComposer<unknown[], InputContext, OutputContext>(runs.filter(Boolean));
};

export default class Router<
  PreInputContext extends RequestContext = RequestContext,
  InputContext extends RequestContext = RequestContext,
  Routes extends BaseRoutes = BaseRoutes,
  Prefix extends string = '',
> implements BaseRouter<PreInputContext, InputContext, Routes, Prefix>
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
  protected readonly middlewareArray: Array<MiddlewareFunction<PreInputContext, InputContext>> = [];

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

  public routes(): MiddlewareFunction<PreInputContext, InputContext | PreInputContext> {
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

      const run = composeArray<PreInputContext, InputContext>(
        ...this.middlewareArray,
        route.runnable
      );

      try {
        await run(
          originalContext,
          async (context) => {
            const responseGuard = route.guard.response;

            if (!responseGuard && route.path !== openApiRoute && context.json !== undefined) {
              throw new TypeError('Response guard is required when providing a response json.');
            }

            return next({
              ...context,
              json: responseGuard?.parse(context.json) ?? context.json,
              status: context.status ?? (context.json ? 200 : 204),
            });
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

  public use<NewInputContext extends InputContext>(
    middleware: MiddlewareFunction<InputContext, NewInputContext>
  ): Router<PreInputContext, NewInputContext, Routes, Prefix> {
    if (Object.values(this.routesMap).length > 0) {
      throw new Error('Middleware must be added before adding routes');
    }

    // @ts-expect-error Force update for the new input context
    // eslint-disable-next-line @silverhand/fp/no-mutating-methods
    this.middlewareArray.push(middleware);

    // @ts-expect-error Force update for the new input context
    // eslint-disable-next-line no-restricted-syntax
    return this as Router<NewInputContext, Routes, Prefix>;
  }

  public withOpenApi(
    parseSearch?: <T>(guard?: Parser<T>) => OpenAPIV3.ParameterObject[],
    parse?: <T>(guard?: Parser<T>) => OpenAPIV3.SchemaObject,
    info?: Partial<OpenAPIV3.InfoObject>
  ) {
    return this.get<typeof openApiRoute, unknown, unknown, OpenAPIV3.Document>(
      openApiRoute,
      {},
      async (context, next) => {
        return next({
          ...context,
          json: buildOpenApiJson(this.routesMap, parseSearch, parse, info),
        });
      }
    );
  }

  public pack<
    AnotherRoutes extends BaseRoutes,
    AnotherInputContext extends InputContext extends AnotherInputContext ? RequestContext : never,
  >(
    another: Router<AnotherInputContext, AnotherInputContext, AnotherRoutes, string> // Don't care another prefix since routes are all prefixed
  ): Router<
    PreInputContext,
    InputContext,
    MergeRoutes<Routes, RoutesWithPrefix<AnotherRoutes, Prefix>>,
    Prefix
  > {
    // TODO: Consider to add the instance from another router to support middleware
    if (another.middlewareArray.length > 0) {
      throw new Error('Another router must not have middleware');
    }

    for (const [method, routes] of Object.entries(another.routesMap)) {
      this.routesMap[method] = (this.routesMap[method] ?? []).concat(
        // @ts-expect-error It's ok for another router to have a different input context since:
        // - We don't care the output contexts of routers.
        // - As long as the pre-input context compatible with the current one
        routes.map((instance) => instance.clone(this.prefix + instance.prefix))
      );
    }

    // Intended
    // eslint-disable-next-line no-restricted-syntax
    return this as Router<
      PreInputContext,
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
  ): BuildRoute<PreInputContext, InputContext, Routes, Prefix, Method> {
    // @ts-expect-error The function overload it too complex to make TypeScript happy
    // We'll make it right in the implementation
    return <Path extends string, Search, Body, JsonResponse>(
      path: Path extends Normalized<Path> ? Path : never,
      guard: RequestGuard<Search, Body, JsonResponse>,
      ...runs: Array<MiddlewareFunction<InputContext>>
    ) => {
      this.routesMap[method] = (this.routesMap[method] ?? []).concat(
        new Route(this.prefix, path, guard, composeArray<InputContext, InputContext>(...runs))
      );

      // eslint-disable-next-line no-restricted-syntax
      return this as ReturnType<ReturnType<typeof this.buildRoute<Method>>>;
    };
  }
}

export type CreateRouter = {
  <InputContext extends RequestContext>(): Router<InputContext, InputContext>;
  <InputContext extends RequestContext, Prefix extends string>(
    prefix: NormalizedPrefix<Prefix>
  ): Router<InputContext, InputContext, BaseRoutes, NormalizedPrefix<Prefix>>;
};

export const createRouter: CreateRouter = <Prefix extends string>(
  prefix?: NormalizedPrefix<Prefix>
) => (prefix ? new Router(prefix) : new Router()); // To make TypeScript happy

export type { RouterWithRoute, BuildRoute } from './types.build-route.js';
