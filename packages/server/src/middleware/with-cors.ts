import type { BaseContext, NextFunction } from '../middleware.js';

/**
 * DON'T USE. This is a naive version of CORS. For test purpose only.
 */
export default function withCors() {
  return async <InputContext extends BaseContext>(
    context: InputContext,
    next: NextFunction<InputContext>
  ) =>
    next({
      ...context,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
        'Access-Control-Max-Age': 2_592_000, // 30 days
      },
    });
}
