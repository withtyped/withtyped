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
      return allowedOrigin;
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
        ...headers,
        ...(allowOrigin && { 'Access-Control-Allow-Origin': allowOrigin }),
        'Access-Control-Allow-Headers': matchHeaders(headers),
        'Access-Control-Allow-Methods': allowMethods,
        'Access-Control-Max-Age': maxAge,
      },
    });
  };
}
