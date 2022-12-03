import assert from 'node:assert';
import type { IncomingHttpHeaders } from 'node:http';
import { describe, it } from 'node:test';

import { contentTypes, RequestMethod } from '@withtyped/shared';

import withCors from './with-cors.js';
import type { RequestContext } from './with-request.js';

const mockContext: (
  url: URL,
  headers?: IncomingHttpHeaders,
  method?: RequestMethod
) => Readonly<RequestContext> = (url, headers, method = RequestMethod.OPTIONS) =>
  Object.freeze({
    request: {
      method,
      headers: { 'content-type': contentTypes.json, origin: 'https://localhost', ...headers },
      url,
    },
  });

const endpointUrl = new URL('https://to.log:3000');

describe('withCors()', () => {
  const assertHeaders = (
    context: RequestContext,
    origin: string | undefined,
    headers = '*',
    methods = '*',
    maxAge = 600,
    allowCredentials = false
    // eslint-disable-next-line max-params, unicorn/consistent-function-scoping
  ) => {
    assert.deepStrictEqual(context.headers, {
      ...(origin && { 'access-control-allow-origin': origin }),
      ...(allowCredentials && { 'access-control-allow-credentials': true }),
      'access-control-allow-headers': headers,
      'access-control-allow-methods': methods,
      'access-control-max-age': maxAge,
    });
  };

  it('should set status to 204 for preflight requests', async () => {
    await withCors()(
      mockContext(endpointUrl, { origin: 'http://localhost:3000' }),
      async (context) => {
        assertHeaders(context, 'http://localhost:3000');
        assert.strictEqual(context.status, 204);
      }
    );
  });

  it('should be adaptive for origin by default', async () => {
    await withCors()(
      mockContext(endpointUrl, { origin: 'http://localhost:3000' }),
      async (context) => {
        assertHeaders(context, 'http://localhost:3000');
      }
    );
    await withCors()(mockContext(endpointUrl, { origin: 'https://logto.io' }), async (context) => {
      assertHeaders(context, 'https://logto.io');
    });
  });

  it('should return no origin header if match failed', async () => {
    await withCors({ allowedOrigin: 'http://localhost' })(
      mockContext(endpointUrl),
      async (context) => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        assertHeaders(context, undefined);
      }
    );

    await withCors({ allowedOrigin: /https?:\/\/logto.io/ })(
      mockContext(endpointUrl, { origin: 'https://local.io' }),
      async (context) => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        assertHeaders(context, undefined);
      }
    );
  });

  it('should show proper origin', async () => {
    const withCorsRegExp = withCors({ allowedOrigin: /https?:\/\/logto.io/ });
    await Promise.all(
      ['http://logto.io', 'https://logto.io:2000'].map(async (origin) =>
        withCorsRegExp(mockContext(endpointUrl, { origin }), async (context) => {
          assertHeaders(context, origin);
        })
      )
    );

    await withCors({ allowedOrigin: 'http://localhost:3000' })(
      mockContext(endpointUrl, { origin: 'http://localhost:3000' }),
      async (context) => {
        assertHeaders(context, 'http://localhost:3000');
      }
    );
  });

  it('should show proper headers', async () => {
    const withCorsRegExp = withCors({ allowedHeaders: /content-.*/ });
    await withCorsRegExp(
      mockContext(endpointUrl, {
        origin: 'http://localhost:3000',
        'access-control-request-headers': 'content-type, content-encoding, accept-language',
      }),
      async (context) => {
        assertHeaders(context, 'http://localhost:3000', 'content-type, content-encoding');
      }
    );

    await withCors({ allowedHeaders: ['foo', 'bar'] })(
      mockContext(endpointUrl),
      async (context) => {
        assertHeaders(context, 'https://localhost', 'foo, bar');
      }
    );
  });

  it('should show proper methods', async () => {
    await withCors({ allowedMethods: ['GET', 'DELETE'] })(
      mockContext(endpointUrl),
      async (context) => {
        assertHeaders(context, 'https://localhost', undefined, 'GET, DELETE');
      }
    );
  });

  it('should show proper max-age and allow-credentials header', async () => {
    await withCors({ maxAge: 100, allowCredentials: true })(
      mockContext(endpointUrl),
      async (context) => {
        assertHeaders(context, 'https://localhost', undefined, undefined, 100, true);
      }
    );
  });

  it('should return only origin header for non-preflight requests', async () => {
    await withCors({ allowCredentials: true })(
      mockContext(endpointUrl, { origin: 'http://localhost:3000' }, RequestMethod.POST),
      async (context) => {
        assert.deepStrictEqual(context.headers, {
          'access-control-allow-origin': 'http://localhost:3000',
          'access-control-allow-credentials': true,
        });
        assert.strictEqual(context.status, undefined);
      }
    );
  });
});
