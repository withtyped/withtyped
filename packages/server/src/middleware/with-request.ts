import type { IncomingHttpHeaders } from 'http';
import { TLSSocket } from 'tls';

import type { BaseContext, HttpContext, NextFunction } from '../middleware.js';
import type { RequestMethod } from '../request.js';
import { requestMethods } from '../request.js';

export type WithRequestContext<InputContext> = InputContext & {
  request: { method?: RequestMethod; headers: IncomingHttpHeaders; url: URL; body?: unknown };
};

export type RequestContext = WithRequestContext<BaseContext>;

export type MergeRequestContext<InputContext extends RequestContext, MergeType> = Omit<
  InputContext,
  'request'
> & { request: InputContext['request'] & MergeType };

export default function withRequest<InputContext extends BaseContext>() {
  return async (
    context: InputContext,
    next: NextFunction<WithRequestContext<InputContext>>,
    { request: { method, headers, url, socket } }: HttpContext
  ) => {
    const protocol = socket instanceof TLSSocket ? 'https' : 'http';
    // Empty host will fail when constructing URL
    // which is expected since host is mandatory in HTTP/1.1
    const host = headers.host ?? '';

    return next({
      ...context,
      request: {
        method: requestMethods.find((value) => value === method?.toUpperCase()),
        headers,
        url: new URL(url ?? '', `${protocol}://${host}`),
      },
    });
  };
}
