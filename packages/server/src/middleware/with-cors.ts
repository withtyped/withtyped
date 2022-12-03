import type { IncomingHttpHeaders } from 'http';

import type { RequestMethod } from '@withtyped/shared';

import type { NextFunction } from '../middleware.js';
import type { RequestContext } from './with-request.js';

export type WithCorsConfig<T extends string> = {
  allowedOrigin?: (T extends 'adaptive' | '*' ? never : T) | RegExp | 'adaptive';
  allowedHeaders?: string[] | RegExp | '*';
  allowedMethods?: Array<string | RequestMethod> | '*';
  maxAge?: number;
};

export default function withCors<
  InputContext extends RequestContext,
  T extends string = 'adaptive'
>({
  allowedOrigin = 'adaptive',
  allowedHeaders = '*',
  allowedMethods = '*',
  maxAge = 2_592_000, // 30 days
}: WithCorsConfig<T> = {}) {
  const matchOrigin = ({ origin }: IncomingHttpHeaders) => {
    if (!origin) {
      return;
    }

    if (allowedOrigin === 'adaptive') {
      return origin;
    }

    if (typeof allowedOrigin === 'string') {
      return allowedOrigin === origin ? allowedOrigin : undefined;
    }

    return allowedOrigin.test(origin) ? origin : undefined;
  };

  const matchHeaders = (requestHeaders: string[]) => {
    if (allowedHeaders instanceof RegExp) {
      return requestHeaders.filter((value) => allowedHeaders.test(value)).join(', ');
    }

    return Array.isArray(allowedHeaders) ? allowedHeaders.join(', ') : allowedHeaders;
  };

  const allowMethods = Array.isArray(allowedMethods) ? allowedMethods.join(', ') : allowedMethods;

  return async (context: InputContext, next: NextFunction<InputContext>) => {
    const { headers } = context.request;
    const allowOrigin = matchOrigin(headers);

    return next({
      ...context,
      headers: {
        ...context.headers,
        ...(allowOrigin && { 'access-control-allow-origin': allowOrigin }),
        'access-control-allow-headers': matchHeaders(
          headers['access-control-request-headers']?.split(',').map((value) => value.trim()) ?? []
        ),
        'access-control-allow-methods': allowMethods,
        'access-control-max-age': maxAge,
      },
    });
  };
}
