import RequestError from '../../errors/RequestError.js';
import type { RequestContext } from '../../middleware/with-request.js';
import type { HttpContext, MiddlewareFunction, NextFunction } from '../../middleware.js';
import type { GuardedContext, RequestGuard } from '../types.js';

import { guardInput } from './utils.js';

export abstract class RouteLike<
  InputContext extends RequestContext,
  Path extends string = string,
  Search = unknown,
  Body = unknown,
  JsonResponse = unknown
> {
  abstract prefix: string;
  abstract path: Path;
  abstract readonly fullPath: string;
  abstract runnable: MiddlewareFunction<InputContext, InputContext & { json?: JsonResponse }>;
  abstract guard: RequestGuard<Search, Body, JsonResponse>;
  abstract clone(newPrefix?: string): RouteLike<InputContext, Path, Search, Body, JsonResponse>;
}

export default class Route<
  InputContext extends RequestContext,
  Path extends string = string,
  Search = unknown,
  Body = unknown,
  JsonResponse = unknown
> implements RouteLike<InputContext, Path, Search, Body, JsonResponse>
{
  constructor(
    public readonly prefix: string,
    public readonly path: Path,
    public readonly guard: RequestGuard<Search, Body, JsonResponse>,
    protected run: MiddlewareFunction<
      GuardedContext<InputContext, Path, Search, Body>,
      InputContext & { json?: JsonResponse }
    >
  ) {}

  public get fullPath(): `${string}${Path}` {
    return `${this.prefix}${this.path}`;
  }

  public get runnable(): (
    context: InputContext,
    next: NextFunction<InputContext & { json?: JsonResponse }>,
    http: HttpContext
  ) => Promise<void> {
    return async (context, next, http) => {
      try {
        // We don't want to catch errors during running, this try-catch is for `guardInput()`
        // eslint-disable-next-line @typescript-eslint/return-await
        return this.run(
          {
            ...context,
            guarded: guardInput(
              this.prefix,
              this.path,
              context.request.url,
              context.request.body,
              this.guard
            ),
          },
          next,
          http
        );
      } catch (error: unknown) {
        if (error instanceof RequestError) {
          throw error;
        }

        throw new RequestError(
          error instanceof Error ? error.message : 'Request input error',
          400,
          error
        );
      }
    };
  }

  public clone(newPrefix = this.prefix) {
    return new Route(newPrefix, this.path, this.guard, this.run);
  }
}
