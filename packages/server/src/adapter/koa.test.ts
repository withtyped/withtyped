import assert from 'node:assert';
import { describe, it } from 'node:test';

import { RequestMethod } from '@withtyped/shared';
import type { ParameterizedContext } from 'koa';
import sinon from 'sinon';

import { createHttpContext } from '../test-utils/http.test.js';

import koaAdapter from './koa.js';

describe('koaAdapter()', () => {
  it('should compose proper context and pass to the given middleware function', async () => {
    const koaNext = sinon.fake();
    const { request, response } = createHttpContext();

    /* eslint-disable @silverhand/fp/no-mutation */
    request.method = RequestMethod.GET;
    request.headers.host = 'localtest:3000';
    request.headers['content-type'] = 'some-random-type';
    request.url = '/foo/bar';
    /* eslint-enable @silverhand/fp/no-mutation */

    const fakeSet = sinon.fake();
    // @ts-expect-error for testing
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const ctx = { req: request, res: response, request: {}, set: fakeSet } as ParameterizedContext;
    await koaAdapter(async (context, next) => {
      assert.deepStrictEqual(context.request, {
        method: RequestMethod.GET,
        headers: {
          host: 'localtest:3000',
          'content-type': 'some-random-type',
        },
        url: new URL('/foo/bar', 'http://localtest:3000'),
      });

      return next({
        ...context,
        status: 204,
        headers: { 'transformed-by': 'withtyped Koa adapter', header2: 'ok' },
      });
    })(ctx, koaNext);

    assert.ok(koaNext.calledOnceWithExactly());
    assert.ok(!ctx.headersSent);
    assert.strictEqual(ctx.status, 204);
    assert.ok(fakeSet.calledWithExactly('transformed-by', 'withtyped Koa adapter'));
    assert.ok(fakeSet.calledWithExactly('header2', 'ok'));
  });

  it('should write body to the response object', async () => {
    const koaNext = sinon.fake();
    const { request, response } = createHttpContext();

    /* eslint-disable @silverhand/fp/no-mutation */
    request.method = RequestMethod.GET;
    request.headers.host = 'localtest:3000';
    request.url = '/';
    /* eslint-enable @silverhand/fp/no-mutation */

    const fakeSet = sinon.fake();
    // @ts-expect-error for testing
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const ctx = {
      req: request,
      res: response,
      request: { body: { ok: 'okk' } },
      set: fakeSet,
    } as ParameterizedContext;
    await koaAdapter(async (context, next) => {
      assert.deepStrictEqual(context.request.body, { ok: 'okk' });

      return next({
        ...context,
        status: 200,
        headers: { test: 'foo/bar', foo: 2 },
        json: { host: context.request.headers.host, foo: ['bar'] },
      });
    })(ctx, koaNext);

    assert.ok(koaNext.calledOnceWithExactly());
    assert.ok(!ctx.headersSent);
    assert.strictEqual(ctx.status, 200);
    assert.ok(fakeSet.calledWithExactly('test', 'foo/bar'));
    assert.ok(fakeSet.calledWithExactly('foo', '2'));
    assert.deepStrictEqual(ctx.body, { host: 'localtest:3000', foo: ['bar'] });
  });

  it('should not set body if no json in context', async () => {
    const koaNext = sinon.fake();
    const { request, response } = createHttpContext();

    /* eslint-disable @silverhand/fp/no-mutation */
    request.method = RequestMethod.GET;
    request.headers.host = 'localtest:3000';
    request.url = '/';
    /* eslint-enable @silverhand/fp/no-mutation */

    const fakeSet = sinon.fake();
    // @ts-expect-error for testing
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const ctx = {
      req: request,
      res: response,
      status: 404,
      request: {},
      set: fakeSet,
    } as ParameterizedContext;
    await koaAdapter(async (context, next) => {
      return next(context);
    })(ctx, koaNext);

    assert.ok(koaNext.calledOnceWithExactly());
    assert.ok(!ctx.headersSent);
    assert.ok(!ctx.body);
    assert.strictEqual(ctx.status, 404);
  });
});
