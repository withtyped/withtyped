import http from 'node:http';
import { promisify } from 'node:util';

import { conditional, trySafe } from '@silverhand/essentials';
import { color, contentTypes, log } from '@withtyped/shared';
import { nanoid } from 'nanoid';

import type { Composer } from './compose.js';
import compose from './compose.js';
import RequestError from './errors/RequestError.js';
import type { BaseContext } from './middleware.js';
import type QueryClient from './query/client.js';
import { getWriteResponse, writeContextToResponse } from './response.js';

export type CreateServer<
  T extends unknown[],
  InputContext extends BaseContext,
  OutputContext extends BaseContext,
> = {
  /** Port to listen, default to 9001. */
  port?: number;
  /** The middleware composer to execute. */
  composer?: Composer<T, InputContext, OutputContext>;
  /** An array of query clients. The server will automatically init these clients in `listen()` and end these clients when server closing. */
  queryClients?: QueryClient[];
  /** Use 'none' to turn off the log. */
  logLevel?: 'none' | 'info';
  /**
   * If enabled, the server will add a 16-character request ID to the following places:
   *
   * - The context object (`context.requestId`)
   * - The response header
   * - The console log
   *
   * The request ID will be added to the response header with the name specified in `headerName`. Default to `x-request-id`.
   */
  requestId?: {
    enabled: true;
    /**
     * The header name to add the request ID.
     *
     * @default 'x-request-id'
     */
    headerName?: string;
  };
};

const promisifyEnd = (response: http.ServerResponse) =>
  promisify((callback: ErrorCallback) => response.end(callback));

export const handleError = async (response: http.ServerResponse, error: unknown) => {
  log.warn(error);

  const requestError = error instanceof RequestError ? error : undefined;

  if (!response.headersSent) {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    response.statusCode = requestError?.status ?? 500;
    response.setHeader('content-type', contentTypes.json);
  }

  await getWriteResponse(response)({
    message: requestError?.message ?? 'Internal server error.',
    ...conditional(requestError?.original ? { error: requestError.original } : undefined),
  });

  await promisifyEnd(response)();
};

/**
 * Create a new withtyped server with the given config.
 *
 * @param config The config object.
 * @returns An object including the server and its utilities.
 */
export default function createServer<T extends unknown[], OutputContext extends BaseContext>(
  config: CreateServer<T, BaseContext, OutputContext> = {}
) {
  const { port = 9001, composer, queryClients, logLevel = 'info' } = config;
  const composed = composer ?? compose();
  // eslint-disable-next-line complexity -- let's refactor this later
  const server = http.createServer(async (request, response) => {
    const requestId = config.requestId?.enabled ? nanoid(16) : undefined;
    const requestIdHeader = config.requestId?.headerName ?? 'x-request-id';

    // Start log
    if (logLevel !== 'none') {
      console.debug(
        requestId ? `${color(requestId, 'dim')}  ${color('in', 'blue')}` : color('in', 'blue'),
        color(request.method, 'bright'),
        request.url
      );
    }
    const startTime = Date.now();

    if (requestId) {
      response.setHeader(requestIdHeader, requestId);
    }

    // Run the middleware chain
    try {
      await composed(
        requestId ? { requestId } : {},
        async (context) => writeContextToResponse(response, context),
        {
          request,
          response,
        }
      );

      // End
      if (!(response.writableEnded || response.destroyed)) {
        await promisifyEnd(response)();
      }
    } catch (error: unknown) {
      // Global error handling
      // Safely handle it in case it's ended or destroyed
      await trySafe(handleError(response, error));
    }

    // End log
    if (logLevel !== 'none') {
      console.debug(
        requestId
          ? `${color(requestId, 'dim')} ${color('out', 'magenta')}`
          : color('out', 'magenta'),
        color(request.method, 'bright'),
        request.url,
        response.statusCode,
        `${Date.now() - startTime}ms`
      );
    }
  });

  const closeServer = async () =>
    new Promise((resolve) => {
      server.close((error) => {
        resolve(error);
      });
    });

  const close = async () => {
    if (queryClients) {
      await Promise.all(queryClients.map(async (client) => client.end()));
    }

    console.debug('Exited');
    await closeServer();
  };

  // eslint-disable-next-line @silverhand/fp/no-let
  let killed = false;

  const kill = async () => {
    if (killed) {
      return;
    }

    // eslint-disable-next-line @silverhand/fp/no-mutation
    killed = true;

    await close();

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(0);
  };

  return {
    server,
    /** Shut down all query clients and the server. */
    close,
    /** Start all query clients and the server in order. */
    listen: async (callback?: (port: number) => void) => {
      process.on('SIGINT', kill);
      process.on('SIGQUIT', kill);
      process.on('SIGTERM', kill);

      if (queryClients) {
        await Promise.all(queryClients.map(async (client) => client.connect()));
      }

      if (callback) {
        server.on('listening', () => {
          callback(port);
        });
      }

      server.listen(port);
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

export { default as ModelClient } from './model-client/index.js';
export * from './model-client/index.js';
export { default as DatabaseInitializer } from './database-initializer/index.js';
export * from './query/index.js';
export * from './identifiable/index.js';
