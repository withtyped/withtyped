import type { Middleware } from 'koa';

import compose from '../compose.js';
import type { MiddlewareFunction } from '../middleware.js';
import withRequest from '../middleware/with-request.js';
import { writeContextToResponse } from '../response.js';

/**
 * Transform a withtyped middleware function to KoaJS middleware function.
 * The withtyped middleware function can assume the context is a `RequestContext` based on the IncomingMessage.
 *
 * @param middleware The withtyped middleware function to transform.
 * @returns A KoaJS middleware function that chains `withRequest()` and `middleware` under the hood.
 */
export default function koaAdapter(middleware: MiddlewareFunction): Middleware {
  return async ({ req: request, res: response }, next) => {
    await compose(withRequest()).and(middleware)(
      {},
      async (context) => writeContextToResponse(response, context),
      { request, response }
    );

    return next();
  };
}
