import assert from 'node:assert';

import type { ParameterizedContext } from 'koa';
import { describe, it } from 'node:test';
import sinon from 'sinon';

import { RequestMethod } from '../request.js';
import { createHttpContext } from '../test-utils/request.js';
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
    })({ req: request, res: response } as ParameterizedContext, koaNext);

    assert.ok(koaNext.calledOnceWithExactly());
    assert.ok(!response.headersSent);
    assert.strictEqual(response.statusCode, 204);
    assert.deepStrictEqual(response.getHeader('transformed-by'), 'withtyped Koa adapter');
    assert.deepStrictEqual(response.getHeader('header2'), 'ok');
  });

  it('should write body to the response object', async () => {
    const koaNext = sinon.fake();
    const { request, response } = createHttpContext();

    /* eslint-disable @silverhand/fp/no-mutation */
    request.method = RequestMethod.GET;
    request.headers.host = 'localtest:3000';
    request.url = '/';
    /* eslint-enable @silverhand/fp/no-mutation */

    const stub = sinon.stub(response, 'write').callsFake((_, __, callback) => {
      callback?.(null);

      return true;
    });

    await koaAdapter(async (context, next) => {
      return next({
        ...context,
        status: 200,
        headers: { test: 'foo/bar' },
        json: { host: context.request.headers.host, foo: ['bar'] },
      });
    })({ req: request, res: response } as ParameterizedContext, koaNext);

    assert.ok(koaNext.calledOnceWithExactly());
    assert.ok(!response.headersSent);
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.getHeader('Content-Type'), 'application/json');
    assert.strictEqual(response.getHeader('Test'), 'foo/bar');
    assert.ok(
      stub.calledOnceWith(JSON.stringify({ host: 'localtest:3000', foo: ['bar'] }), 'utf8')
    );
  });
});
