import RequestError from '../../errors/RequestError.js';
import type { HttpContext, MiddlewareFunction, NextFunction } from '../../middleware.js';
import type { RequestContext } from '../../middleware/with-request.js';
import type { GuardedContext, RequestGuard } from '../types.js';
import { guardInput } from './utils.js';

export abstract class RouteLike<
  Path extends string = string,
  Search = unknown,
  Body = unknown,
  OutputContext extends RequestContext = RequestContext
> {
  abstract prefix: string;
  abstract path: Path;
  abstract readonly fullPath: string;
  abstract runnable: MiddlewareFunction<RequestContext, OutputContext>;
  abstract guard: RequestGuard<Search, Body, unknown>;
  abstract clone(newPrefix?: string): RouteLike<Path, Search, Body, OutputContext>;
}

export default class Route<
  Path extends string = string,
  Search = unknown,
  Body = unknown,
  OutputContext extends RequestContext = RequestContext
> extends RouteLike {
  constructor(
    public readonly prefix: string,
    public readonly path: Path,
    public readonly guard: RequestGuard<Search, Body, unknown>,
    protected run: MiddlewareFunction<
      GuardedContext<RequestContext, Path, Search, Body>,
      OutputContext
    >
  ) {
    super();
  }

  public get fullPath(): `${string}${Path}` {
    return `${this.prefix}${this.path}`;
  }

  public get runnable(): <InputContext extends RequestContext>(
    context: InputContext,
    next: NextFunction<OutputContext>,
    http: HttpContext
  ) => Promise<void> {
    return async (context, next, http) => {
      try {
        // We don't want to catch errors during running, this try-catch is for `guardInput()`
        // eslint-disable-next-line @typescript-eslint/return-await
        return this.run(
          {
            ...context,
            request: {
              ...context.request,
              ...guardInput(
                this.prefix,
                this.path,
                context.request.url,
                context.request.body,
                this.guard
              ),
            },
          },
          next,
          http
        );
      } catch (error: unknown) {
        if (error instanceof TypeError) {
          throw new RequestError(error.message, 400, error);
        }

        throw error;
      }
    };
  }

  public clone(newPrefix = this.prefix) {
    return new Route(newPrefix, this.path, this.guard, this.run);
  }
}
