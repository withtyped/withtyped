import type { BaseContext, MiddlewareFunction } from '../middleware.js';
import { color, log } from '../utils.js';

export default function withSystemLog<InputContext extends BaseContext>(): MiddlewareFunction<
  InputContext,
  InputContext
> {
  return async (context, next, { request, response }) => {
    console.log(color(' in', 'blue'), color(request.method ?? 'N/A', 'bright'), request.url);
    const startTime = Date.now();

    // TODO: This try-catch block is for testing purpose. Consider moving to somewhere else.
    try {
      await next(context);
    } catch (error: unknown) {
      log.debug(error);
      // eslint-disable-next-line @silverhand/fp/no-mutation
      response.statusCode = 500;
    }

    console.log(
      color('out', 'magenta'),
      color(request.method ?? 'N/A', 'bright'),
      request.url,
      response.statusCode,
      `${Date.now() - startTime}ms`
    );
  };
}
