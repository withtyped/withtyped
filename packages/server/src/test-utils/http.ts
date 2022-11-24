import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { TLSSocket } from 'node:tls';

import type { HttpContext } from '../middleware.js';

export const createHttpContext: (isHttps?: boolean) => HttpContext = (isHttps = false) => {
  const request = new IncomingMessage(isHttps ? new TLSSocket(new Socket()) : new Socket());

  return {
    request,
    response: new ServerResponse(request),
  };
};
