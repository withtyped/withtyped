import type { IncomingHttpHeaders } from 'node:http';

import { RequestMethod } from '@withtyped/shared';

import type { NextFunction } from '../middleware.js';

import type { RequestContext } from './with-request.js';

export type WithCorsConfig<T extends string> = {
  /** Default to 'adaptive' */
  allowedOrigin?: (T extends 'adaptive' | '*' ? never : T) | RegExp | 'adaptive';
  /** Default to '*' */
  allowedHeaders?: string[] | RegExp | '*';
  /** Default to '*' */
  allowedMethods?: Array<string | RequestMethod> | '*';
  /** Default to `false` */
  allowCredentials?: boolean;
  /** Default to 600 */
  maxAge?: number;
};

export default function withCors<
  InputContext extends RequestContext,
  T extends string = 'adaptive'
>({
  allowedOrigin = 'adaptive',
  allowedHeaders = '*',
  allowedMethods = '*',
  allowCredentials = false,
  maxAge = 600, // 10 mins
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

  // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
  return async (context: InputContext, next: NextFunction<InputContext>) => {
    const { headers, method } = context.request;
    const allowOrigin = matchOrigin(headers);
    const universalHeaders = {
      ...(allowOrigin && { 'access-control-allow-origin': allowOrigin }),
      ...(allowCredentials && { 'access-control-allow-credentials': true }),
    };

    // Some headers are only for preflight requests
    if (method === RequestMethod.OPTIONS) {
      return next({
        ...context,
        status: 204,
        headers: {
          ...context.headers,
          ...universalHeaders,
          'access-control-allow-headers': matchHeaders(
            headers['access-control-request-headers']?.split(',').map((value) => value.trim()) ?? []
          ),
          'access-control-allow-methods': allowMethods,
          'access-control-max-age': maxAge,
        },
      });
    }

    // Should we guard per config in backend, or just trust the browser?
    // Normal requests
    return next({
      ...context,
      headers: {
        ...context.headers,
        ...universalHeaders,
      },
    });
  };
}
