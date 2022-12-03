import assert from 'node:assert';
import type { IncomingHttpHeaders } from 'node:http';
import { describe, it } from 'node:test';

import { contentTypes, RequestMethod } from '@withtyped/shared';

import withCors from './with-cors.js';
import type { RequestContext } from './with-request.js';

const mockContext: (url: URL, headers?: IncomingHttpHeaders) => Readonly<RequestContext> = (
  url,
  headers
) =>
  Object.freeze({
    request: {
      method: RequestMethod.POST,
      headers: { 'content-type': contentTypes.json, ...headers },
      url,
    },
  });

describe('withCors()', () => {
  const assertHeaders = (
    context: RequestContext,
    origin: string | undefined,
    headers = '*',
    methods = '*',
    maxAge = 2_592_000
    // eslint-disable-next-line max-params, unicorn/consistent-function-scoping
  ) => {
    assert.deepStrictEqual(context.headers, {
      ...(origin && { 'access-control-allow-origin': origin }),
      'access-control-allow-headers': headers,
      'access-control-allow-methods': methods,
      'access-control-max-age': maxAge,
    });
  };

  it('should be adaptive for origin by default', async () => {
    await withCors()(mockContext(new URL('http://localhost:3000')), async (context) => {
      assertHeaders(context, 'http://localhost:3000');
    });
    await withCors()(mockContext(new URL('https://logto.io')), async (context) => {
      assertHeaders(context, 'https://logto.io');
    });
  });

  it('should return no origin header if match failed', async () => {
    await withCors({ allowedOrigin: 'http://localhost' })(
      mockContext(new URL('http://localhost:3000')),
      async (context) => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        assertHeaders(context, undefined);
      }
    );

    await withCors({ allowedOrigin: /https?:\/\/logto.io/ })(
      mockContext(new URL('http://localhost:3000')),
      async (context) => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        assertHeaders(context, undefined);
      }
    );
  });

  it('should show proper origin', async () => {
    const withCorsRegExp = withCors({ allowedOrigin: /https?:\/\/logto.io/ });
    await Promise.all(
      ['http://logto.io', 'https://logto.io:2000'].map(async (url) =>
        withCorsRegExp(mockContext(new URL(url)), async (context) => {
          assertHeaders(context, url);
        })
      )
    );

    await withCors({ allowedOrigin: 'http://localhost:3000' })(
      mockContext(new URL('http://localhost:3000')),
      async (context) => {
        assertHeaders(context, 'http://localhost:3000');
      }
    );
  });

  it('should show proper headers', async () => {
    const withCorsRegExp = withCors({ allowedHeaders: /content-.*/ });
    await withCorsRegExp(
      mockContext(new URL('http://localhost:3000'), {
        'content-type': 'some-type',
        'content-encoding': 'some-encoding',
        'accept-language': 'some-language',
      }),
      async (context) => {
        assertHeaders(context, 'http://localhost:3000', 'content-type, content-encoding');
      }
    );

    await withCors({ allowedHeaders: ['foo', 'bar'] })(
      mockContext(new URL('https://localhost')),
      async (context) => {
        assertHeaders(context, 'https://localhost', 'foo, bar');
      }
    );
  });

  it('should show proper methods', async () => {
    await withCors({ allowedMethods: ['GET', 'OPTIONS'] })(
      mockContext(new URL('https://localhost')),
      async (context) => {
        assertHeaders(context, 'https://localhost', undefined, 'GET, OPTIONS');
      }
    );
  });

  it('should show proper max-age', async () => {
    await withCors({ maxAge: 100 })(mockContext(new URL('https://localhost')), async (context) => {
      assertHeaders(context, 'https://localhost', undefined, undefined, 100);
    });
  });
});
