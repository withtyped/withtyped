import type { IncomingHttpHeaders } from 'node:http';

import type { BaseContext, HttpContext, NextFunction } from '../middleware.js';
import type { RequestMethod } from '../request.js';
import { requestMethods } from '../request.js';

export type MergeRequestContext<InputContext extends BaseContext, MergeType> = Omit<
  InputContext,
  'request'
> & { request: InputContext['request'] & MergeType };

export type RequestContext = {
  method?: RequestMethod;
  rawMethod?: string;
  headers: IncomingHttpHeaders;
  rawHeaders: string[];
  remoteAddress?: string;
  remotePort?: number;
  remoteFamily?: string;
};

export type WithRequestContext<InputContext extends BaseContext> = MergeRequestContext<
  InputContext,
  RequestContext
>;

export default function withRequest<InputContext extends BaseContext>() {
  return async (
    context: InputContext,
    next: NextFunction<WithRequestContext<InputContext>>,
    { request }: HttpContext
  ) => {
    const {
      method,
      headers,
      rawHeaders,
      socket: { remoteAddress, remoteFamily, remotePort },
    } = request;

    return next({
      ...context,
      request: {
        ...context.request,
        method: requestMethods.find((value) => value === method?.toUpperCase()),
        rawMethod: method,
        headers,
        rawHeaders,
        remoteAddress,
        remotePort,
        remoteFamily,
      },
    });
  };
}
