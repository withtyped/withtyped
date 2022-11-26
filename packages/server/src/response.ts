import type { ServerResponse } from 'http';
import { promisify } from 'node:util';

import type { BaseContext } from './middleware.js';

// Need `null` to make callback be compatible with `promisify()`
// eslint-disable-next-line @typescript-eslint/ban-types
type ErrorCallback = (error?: Error | null) => void;

export const writeContextToResponse = async (
  response: ServerResponse,
  { status, headers, json }: BaseContext
) => {
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
      if (chunk instanceof Buffer || chunk instanceof Uint8Array) {
        return response.write(chunk, callback);
      }

      if (typeof chunk === 'string') {
        return response.write(chunk, 'utf8', callback);
      }

      response.write(JSON.stringify(chunk), 'utf8', callback);
    });

    response.setHeader('content-type', 'application/json');
    await write(json);
  }
};
