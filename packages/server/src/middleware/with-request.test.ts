import assert from 'node:assert';
import { describe, it } from 'node:test';

import { noop, RequestMethod } from '@withtyped/shared';

import { createHttpContext } from '../test-utils/http.test.js';
import { assertContext } from '../test-utils/middleware.test.js';

import withRequest from './with-request.js';

void describe('withRequest()', () => {
  const run = withRequest();

  // Need to mutate context for testing
  /* eslint-disable @silverhand/fp/no-mutation */
  void it('should set `context.request` properly with basic info', async () => {
    const httpContext = createHttpContext();
    httpContext.request.url = undefined;
    httpContext.request.method = RequestMethod.DELETE;
    httpContext.request.headers.host = 'localhost';

    await run(
      {},
      assertContext({
        request: {
          headers: { host: 'localhost' },
          method: 'DELETE',
          url: new URL('http://localhost'),
        },
      }),
      httpContext
    );
  });

  void it('should set `context.request` properly complex headers', async () => {
    const httpContext = createHttpContext(true);
    httpContext.request.url = '/status?name=ryan';
    httpContext.request.method = RequestMethod.POST;
    httpContext.request.headers.host = 'withtyped.io:1000';
    httpContext.request.headers['some-header'] = ['value_1', 'v@luE-2'];

    await run(
      {},
      assertContext({
        request: {
          headers: { host: 'withtyped.io:1000', 'some-header': ['value_1', 'v@luE-2'] },
          method: 'POST',
          url: new URL('/status?name=ryan', 'https://withtyped.io:1000'),
        },
      }),
      httpContext
    );
  });

  void it('should return empty method if method is not in the pre-defined list', async () => {
    const httpContext = createHttpContext();
    httpContext.request.headers.host = 'localhost';
    httpContext.request.method = 'FOO';

    await run(
      {},
      assertContext({
        request: {
          headers: { host: 'localhost' },
          method: undefined,
          url: new URL('http://localhost'),
        },
      }),
      httpContext
    );
  });

  void it('should throw error if no `host` header found', async () => {
    await assert.rejects(run({}, noop, createHttpContext()), TypeError);
  });

  void it('should set `context.request.id` if `context.requestId` is set', async () => {
    const httpContext = createHttpContext();
    httpContext.request.headers.host = 'localhost';
    await run(
      { requestId: '123456' },
      assertContext({
        requestId: '123456',
        request: {
          id: '123456',
          headers: { host: 'localhost' },
          method: undefined,
          url: new URL('http://localhost'),
        },
      }),
      httpContext
    );
  });
  /* eslint-enable @silverhand/fp/no-mutation */
});
