import type { BaseContext, MiddlewareFunction } from '../middleware.js';

const colors = Object.freeze({
  reset: '\u001B[0m',
  dim: '\u001B[2m',
  black: '\u001B[30m',
  red: '\u001B[31m',
  green: '\u001B[32m',
  blue: '\u001B[34m',
  magenta: '\u001B[35m',
  cyan: '\u001B[36m',
} as const);

export const color = (string: string, color: keyof typeof colors) =>
  colors[color] + string + colors.reset;

export default function withSystemLog<InputContext extends BaseContext>(): MiddlewareFunction<
  InputContext,
  InputContext
> {
  return async (context, next, { request, response }) => {
    console.log(color(' in', 'blue'), request.url);
    const startTime = Date.now();

    // TODO: This try-catch block is for testing purpose. Consider moving to somewhere else.
    try {
      await next(context);
    } catch {
      // eslint-disable-next-line @silverhand/fp/no-mutation
      response.statusCode = 500;
    }

    console.log(
      color('out', 'magenta'),
      request.url,
      response.statusCode,
      `${Date.now() - startTime}ms`
    );
  };
}
