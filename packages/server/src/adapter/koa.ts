import type { Middleware } from 'koa';

import compose from '../compose.js';
import type { RequestContext } from '../middleware/with-request.js';
import withRequest from '../middleware/with-request.js';
import type { MiddlewareFunction, NextFunction } from '../middleware.js';

/**
 * Transform a withtyped middleware function to KoaJS middleware function.
 * The withtyped middleware function can assume the context is a `RequestContext` based on the IncomingMessage.
 *
 * Request body should be parsed and stored into `ctx.request.body` if needed.
 *
 * @param middleware The withtyped middleware function to transform.
 * @returns A KoaJS middleware function that chains `withRequest()` and `middleware` under the hood.
 */
export default function koaAdapter<OutputContext extends RequestContext>(
  middleware: MiddlewareFunction<RequestContext, OutputContext>
): Middleware {
  return async (ctx, next) => {
    const { req: request, res: response } = ctx;

    await compose(withRequest())
      .and(async (context, next: NextFunction<RequestContext>) =>
        next({
          ...context,
          request: {
            ...context.request,
            ...('body' in ctx.request && { body: ctx.request.body }),
          },
        })
      )
      .and(middleware)(
      {},
      async (context) => {
        if (context.status && context.status !== 'ignore') {
          ctx.status = context.status;
        }

        if (context.headers) {
          for (const [key, value] of Object.entries(context.headers)) {
            if (value !== undefined) {
              ctx.set(key, typeof value === 'number' ? String(value) : value);
            }
          }
        }

        if (context.json !== undefined) {
          ctx.body = context.json;
        }
      },
      { request, response }
    );

    return next();
  };
}
