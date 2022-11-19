import url from 'node:url';

import type { BaseContext, MiddlewareFunction, NextFunction } from '../middleware.js';
import type { RequestMethod } from '../request.js';
import { lowerRequestMethods } from '../request.js';
import type {
  BaseRoutes,
  GuardedContext,
  PathGuard,
  RequestGuard,
  RouterHandlerMap,
} from './types.js';
import { guardInput, matchRoute } from './utils.js';

export * from './types.js';

type WithHandler<
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

export default class Router<Routes extends BaseRoutes = BaseRoutes> {
  get = this.buildHandler('get');
  post = this.buildHandler('post');

  private readonly handlers: RouterHandlerMap = Object.fromEntries(
    lowerRequestMethods.map((method) => [method, []])
  );

  public routes<InputContext extends BaseContext>(): MiddlewareFunction<
    InputContext,
    InputContext
  > {
    return async (context, next, http) => {
      const { request } = http;

      // TODO: Do best match instead of first match
      const handler = this.handlers[request.method?.toLowerCase() ?? '']?.find((handler) =>
        matchRoute(handler, request)
      );

      if (!handler) {
        return next(context);
      }

      console.log('matched handler', handler);

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

  private buildHandler<Method extends Lowercase<RequestMethod>>(method: Method) {
    return <Path extends string, Query, Body, Response>(
      path: Path,
      guard: RequestGuard<Query, Body, Response>,
      handler: MiddlewareFunction<
        GuardedContext<BaseContext, Path, Query, Body>,
        GuardedContext<BaseContext, Path, Query, Body> & { json?: Response }
      >
    ): WithHandler<Routes, Method, Path, Query, Body, Response> => {
      // eslint-disable-next-line @silverhand/fp/no-mutating-methods, @typescript-eslint/no-non-null-assertion
      this.handlers[method]!.push({
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
            next as NextFunction<
              GuardedContext<BaseContext, Path, Query, Body> & { json?: Response }
            >,
            http
          );
        },
      });

      // eslint-disable-next-line no-restricted-syntax
      return this as WithHandler<Routes, Method, Path, Query, Body, Response>;
    };
  }
}
