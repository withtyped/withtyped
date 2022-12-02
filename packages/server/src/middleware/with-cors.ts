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
  const matchOrigin = (url: URL) => {
    if (allowedOrigin === 'adaptive') {
      return url.origin;
    }

    if (typeof allowedOrigin === 'string') {
      return allowedOrigin === url.origin ? allowedOrigin : undefined;
    }

    return allowedOrigin.test(url.origin) ? url.origin : undefined;
  };

  const matchHeaders = (headers: IncomingHttpHeaders) => {
    if (allowedHeaders instanceof RegExp) {
      return Object.keys(headers)
        .filter((value) => allowedHeaders.test(value))
        .join(', ');
    }

    return Array.isArray(allowedHeaders) ? allowedHeaders.join(', ') : allowedHeaders;
  };

  const allowMethods = Array.isArray(allowedMethods) ? allowedMethods.join(', ') : allowedMethods;

  return async (context: InputContext, next: NextFunction<InputContext>) => {
    const { url, headers } = context.request;
    const allowOrigin = matchOrigin(url);

    return next({
      ...context,
      headers: {
        ...context.headers,
        ...(allowOrigin && { 'access-control-allow-origin': allowOrigin }),
        'access-control-allow-headers': matchHeaders(headers),
        'access-control-allow-methods': allowMethods,
        'access-control-max-age': maxAge,
      },
    });
  };
}
