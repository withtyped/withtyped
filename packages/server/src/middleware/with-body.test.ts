import assert from 'node:assert';
import { describe, it } from 'node:test';

import { contentTypes, noop, RequestMethod } from '@withtyped/shared';

import RequestError from '../errors/RequestError.js';
import type { HttpContext } from '../middleware.js';
import { createHttpContext } from '../test-utils/http.test.js';

import withBody from './with-body.js';
import type { RequestContext } from './with-request.js';

describe('withBody()', () => {
  const run = withBody();
  const mockContext: Readonly<RequestContext> = Object.freeze({
    request: {
      method: RequestMethod.POST,
      headers: { 'content-type': contentTypes.json },
      url: new URL('http://localhost'),
    },
  });

  it('should throw when `content-type` is unexpected and method is valid', async () => {
    const httpContext = createHttpContext();
    const promise = run(
      { ...mockContext, request: { ...mockContext.request, headers: { 'content-type': 'foo' } } },
      noop,
      httpContext
    );
    httpContext.request.emit('data', Buffer.from('{}'));
    httpContext.request.emit('end');
    await assert.rejects(promise, RequestError);
  });

  it('should do nothing when body is empty', async () => {
    const httpContext = createHttpContext();
    const originalContext = {
      ...mockContext,
      request: { ...mockContext.request, headers: { 'content-type': 'foo' } },
    };
    const promise = run(
      originalContext,
      async (context) => {
        assert.deepStrictEqual(context, originalContext);
      },
      httpContext
    );
    httpContext.request.emit('data', Buffer.from(''));
    httpContext.request.emit('end');
    await promise;
  });

  it('should do nothing for certain methods even body has value', async () => {
    const runs = [RequestMethod.GET, RequestMethod.OPTIONS, RequestMethod.HEAD, undefined].map<
      [Promise<void>, HttpContext]
    >((method) => {
      const httpContext = createHttpContext();
      const originalContext = {
        ...mockContext,
        request: { ...mockContext.request, method, headers: { 'content-type': 'foo' } },
      };

      const promise = run(
        originalContext,
        async (context) => {
          assert.deepStrictEqual(context, originalContext);
        },
        httpContext
      );
      httpContext.request.emit('end');

      return [promise, httpContext];
    });

    const raw = '{     "foo": "bar",|   \n  "baz": 1,| \n\n"bar": [true,| false]}';
    const stringArray = raw.split('|');

    for (const value of stringArray) {
      for (const [, { request }] of runs) {
        request.emit('data', Buffer.from(value));
      }
    }

    for (const [, { request }] of runs) {
      request.emit('end');
    }

    await Promise.all(runs.map(async ([promise]) => promise));
  });

  it('should read JSON string and convert to object', async () => {
    const httpContext = createHttpContext();
    const raw = '{     "foo": "bar",|   \n  "baz": 1,| \n\n"bar": [true,| false]}';
    const stringArray = raw.split('|');

    const promise = run(
      mockContext,
      async (context) => {
        assert.deepStrictEqual(context.request.body, JSON.parse(stringArray.join('')));
      },
      httpContext
    );

    for (const value of stringArray) {
      httpContext.request.emit('data', Buffer.from(value));
    }

    httpContext.request.emit('end');
    await promise;
  });

  it('should throw error when request received an error event', async () => {
    const testError = new Error('test');
    const httpContext = createHttpContext();
    const raw = '{     "foo": "bar",|   \n  "baz": 1,| \n\n"bar": [true,| false]}';
    const stringArray = raw.split('|');
    const promise = run(mockContext, noop, httpContext);

    for (const value of stringArray) {
      httpContext.request.emit('data', Buffer.from(value));
    }

    httpContext.request.emit('error', testError);
    await assert.rejects(promise, testError);
  });

  it('should set body to undefined if body is not a valid JSON string', async () => {
    const httpContext = createHttpContext();
    const raw = '{     "true,| false]}';
    const stringArray = raw.split('|');
    const promise = run(
      mockContext,
      async (context) => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        assert.deepStrictEqual(context.request.body, undefined);
      },
      httpContext
    );

    for (const value of stringArray) {
      httpContext.request.emit('data', Buffer.from(value));
    }

    httpContext.request.emit('end');
    await promise;
  });
});
