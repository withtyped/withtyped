import http from 'node:http';
import { promisify } from 'node:util';

import { color, log } from '@withtyped/shared';

import type { Composer } from './compose.js';
import compose from './compose.js';
import RequestError from './errors/RequestError.js';
import type { BaseContext } from './middleware.js';
import { getWriteResponse, writeContextToResponse } from './response.js';

export type CreateServer<
  T extends unknown[],
  InputContext extends BaseContext,
  OutputContext extends BaseContext
> = {
  port?: number;
  composer?: Composer<T, InputContext, OutputContext>;
};

export const handleError = async (response: http.ServerResponse, error: unknown) => {
  log.debug(error);

  const requestError = error instanceof RequestError ? error : undefined;

  if (!response.headersSent) {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    response.statusCode = requestError?.status ?? 500;
    response.setHeader('content-type', 'application/json');
  }

  await getWriteResponse(response)({
    message: requestError?.message ?? 'Internal server error.',
  });
};

export default function createServer<T extends unknown[], OutputContext extends BaseContext>({
  port = 9001,
  composer,
}: CreateServer<T, BaseContext, OutputContext>) {
  const composed = composer ?? compose();
  const server = http.createServer(async (request, response) => {
    // Start log
    console.log(color(' in', 'blue'), color(request.method ?? 'N/A', 'bright'), request.url);
    const startTime = Date.now();

    // Run the middleware chain
    try {
      await composed({}, async (context) => writeContextToResponse(response, context), {
        request,
        response,
      });
    } catch (error: unknown) {
      // Global error handling
      await handleError(response, error);
    }

    // End
    const end = promisify((callback: ErrorCallback) => response.end(callback));
    await end();

    // End log
    console.log(
      color('out', 'magenta'),
      color(request.method ?? 'N/A', 'bright'),
      request.url,
      response.statusCode,
      `${Date.now() - startTime}ms`
    );
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

export * from './types.js';
export { default as RequestError } from './errors/RequestError.js';
export * from './middleware/index.js';
export * from './openapi/openapi-types.js';
export { default as Router } from './router/index.js';
export * from './router/index.js';
export { default as compose } from './compose.js';
export * from './middleware.js';
export { RequestMethod } from '@withtyped/shared';

export { default as Model } from './model/index.js';
export { default as ModelClient } from './model-client/index.js';
export * from './model-client/index.js';
export { default as ModelRouter } from './model-router/index.js';
export * from './query/index.js';
