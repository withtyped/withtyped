import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { TLSSocket } from 'node:tls';

import type { RequestMethod } from '@withtyped/shared';
import sinon from 'sinon';

import type { RequestContext } from '../middleware/with-request.js';
import type { HttpContext } from '../middleware.js';

export const createHttpContext: (isHttps?: boolean) => HttpContext = (isHttps = false) => {
  const request = new IncomingMessage(isHttps ? new TLSSocket(new Socket()) : new Socket());

  return {
    request,
    response: new ServerResponse(request),
  };
};

export const createRequestPayload = (isHttps = false): [IncomingMessage, ServerResponse] => {
  const { request, response } = createHttpContext(isHttps);

  return [request, response];
};

export const createRequestContext = (
  method: RequestMethod | undefined,
  path: string,
  body?: unknown
): RequestContext =>
  Object.freeze({
    request: {
      method,
      url: new URL(path, 'https://localtest'),
      headers: {},
      body,
    },
  });

export const stubResponseWrite = (response: ServerResponse) =>
  sinon.stub(response, 'write').callsFake((_, callback, callback2) => {
    if (typeof callback === 'function') {
      // @ts-expect-error compatible with the function overload
      callback(null);
    } else {
      callback2?.(null);
    }

    return true;
  });
