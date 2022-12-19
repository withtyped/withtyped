import type { Middleware } from 'koa';

import compose from '../compose.js';
import type { MiddlewareFunction } from '../middleware.js';
import type { RequestContext } from '../middleware/with-request.js';
import withRequest from '../middleware/with-request.js';

/**
 * Transform a withtyped middleware function to KoaJS middleware function.
 * The withtyped middleware function can assume the context is a `RequestContext` based on the IncomingMessage.
 *
 * @param middleware The withtyped middleware function to transform.
 * @returns A KoaJS middleware function that chains `withRequest()` and `middleware` under the hood.
 */
export default function koaAdapter<OutputContext extends RequestContext>(
  middleware: MiddlewareFunction<RequestContext, OutputContext>
): Middleware {
  return async (ctx, next) => {
    const { req: request, res: response } = ctx;
    await compose(withRequest()).and(middleware)(
      {},
      async (context) => {
        if (context.status) {
          ctx.status = context.status;
        }

        if (context.headers) {
          for (const [key, value] of Object.entries(context.headers)) {
            if (value !== undefined) {
              ctx.set(key, typeof value === 'number' ? String(value) : value);
            }
          }
        }
        ctx.body = context.json;
      },
      { request, response }
    );

    return next();
  };
}
