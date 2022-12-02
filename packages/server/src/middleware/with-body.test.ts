import assert from 'node:assert';
import { describe, it } from 'node:test';

import { contentTypes, noop, RequestMethod } from '@withtyped/shared';

import RequestError from '../errors/RequestError.js';
import { createHttpContext } from '../test-utils/http.js';
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

  it('should throw when `content-type` is unexpected', async () => {
    const httpContext = createHttpContext();
    await assert.rejects(
      run(
        { ...mockContext, request: { ...mockContext.request, headers: { 'content-type': 'foo' } } },
        noop,
        httpContext
      ),
      RequestError
    );
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
