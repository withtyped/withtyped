import http from 'node:http';
import { promisify } from 'node:util';

import type { Composer } from './compose.js';
import compose from './compose.js';
import type { BaseContext } from './middleware.js';
import { writeContextToResponse } from './response.js';

export type CreateServer<
  T extends unknown[],
  InputContext extends BaseContext,
  OutputContext extends BaseContext
> = {
  port?: number;
  composer?: Composer<T, InputContext, OutputContext>;
};

export default function createServer<T extends unknown[], OutputContext extends BaseContext>({
  port = 9001,
  composer,
}: CreateServer<T, BaseContext, OutputContext>) {
  const composed = composer ?? compose();
  const server = http.createServer(async (request, response) => {
    await composed({}, async (context) => writeContextToResponse(response, context), {
      request,
      response,
    });

    // End
    const end = promisify((callback: ErrorCallback) => response.end(callback));
    await end();
  });

  return {
    server,
    listen: (listener?: (port: number) => void) => {
      server.listen(port);

      if (listener) {
        server.on('listening', () => {
          listener(port);
        });
      }
    },
  };
}

export { default as RequestError } from './errors/RequestError.js';
export * from './middleware/index.js';
export * from './openapi/openapi-types.js';
export { default as Router } from './router/index.js';
export * from './router/index.js';
export { default as compose } from './compose.js';
export * from './middleware.js';
export * from './request.js';
