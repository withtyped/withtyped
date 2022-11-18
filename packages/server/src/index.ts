import http from 'node:http';
import { promisify } from 'node:util';

import type { Composer } from './compose.js';
import compose from './compose.js';
import type { BaseContext } from './middleware.js';

export type CreateServer<
  T extends unknown[],
  InputContext extends BaseContext,
  OutputContext extends BaseContext
> = {
  port?: number;
  composer?: Composer<T, InputContext, OutputContext>;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type ErrorCallback = (error?: Error | null) => void;

export default function createServer<T extends unknown[], OutputContext extends BaseContext>({
  port = 9001,
  composer,
}: CreateServer<T, BaseContext, OutputContext>) {
  const composed = composer ?? compose();
  const server = http.createServer(async (request, response) => {
    await composed(
      {},
      async ({ status, json, headers }) => {
        // Send status along with headers
        // eslint-disable-next-line @silverhand/fp/no-mutation
        response.statusCode = status ?? 404;

        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            if (value) {
              response.setHeader(key, value);
            }
          }
        }

        // Send JSON body
        if (json) {
          const write = promisify((chunk: unknown, callback: ErrorCallback) => {
            if (
              typeof chunk === 'string' ||
              chunk instanceof Buffer ||
              chunk instanceof Uint8Array
            ) {
              return response.write(chunk, callback);
            }
            response.write(JSON.stringify(chunk), callback);
          });

          response.setHeader('Content-Type', 'application/json');
          await write(json);
        }

        // End
        const end = promisify((callback: ErrorCallback) => response.end(callback));
        await end();
      },
      { request, response }
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
