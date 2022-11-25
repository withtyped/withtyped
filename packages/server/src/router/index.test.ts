import assert from 'node:assert';

import { describe, it } from 'node:test';
import sinon from 'sinon';
import { z } from 'zod';

import RequestError from '../errors/RequestError.js';
import { RequestMethod } from '../request.js';
import { bookGuard, createBook, createBookWithoutId } from '../test-utils/entities.js';
import { createHttpContext, createRequestContext } from '../test-utils/request.js';
import { noop } from '../utils.js';
import Router from './index.js';

describe('Router', () => {
  it('should provide a middleware function to call the provided middleware function with request context', async () => {
    const [mid1, mid2, mid3] = [sinon.fake(), sinon.fake(), sinon.fake()];
    const router1 = new Router()
      .get('///books', { response: z.object({ books: bookGuard.array() }) }, mid1)
      .delete('/books/////:id', { response: bookGuard }, mid2);
    const router2 = new Router()
      .pack(router1)
      .post('/books', { body: bookGuard.omit({ id: true }), response: bookGuard }, mid3);
    const [context1, context2, context3, context4] = [
      createRequestContext(RequestMethod.GET, '/books'),
      createRequestContext(RequestMethod.DELETE, '/books/1'),
      createRequestContext(RequestMethod.POST, '/books', createBookWithoutId()),
      createRequestContext(RequestMethod.POST, '/books/foo'),
    ];
    const run = router2.routes();
    const httpContext = createHttpContext();

    await run(context1, noop, httpContext);
    assert.strictEqual(mid1.callCount, 1);
    assert.strictEqual(mid1.calledOnceWith(sinon.match(context1)), true);

    await Promise.all([
      run(context2, noop, httpContext),
      run(context3, noop, httpContext),
      run(context4, noop, httpContext),
    ]);
    assert.strictEqual(mid1.callCount, 1);
    assert.strictEqual(mid1.calledOnceWith(sinon.match(context1)), true);
    assert.strictEqual(mid2.callCount, 1);
    assert.strictEqual(mid2.calledOnceWith(sinon.match(context2)), true);
    assert.strictEqual(mid3.callCount, 1);
    assert.strictEqual(
      mid3.calledOnceWith(
        sinon.match({ ...context3, request: { ...context3.request, params: {} } })
      ),
      true
    );
  });

  it('should set status to 200 with the proper json when everything is ok', async () => {
    const book = createBook();
    const router = new Router().copy('/books', { response: bookGuard }, async (context, next) =>
      next({ ...context, json: book })
    );
    await router.routes()(
      createRequestContext(RequestMethod.COPY, '/books'),
      async (context) => {
        assert.strictEqual(context.status, 200);
        assert.deepStrictEqual(context.json, book);
      },
      createHttpContext()
    );
  });

  it('should set status to 204 when no json returns', async () => {
    const router = new Router().copy('/books', {}, async (context, next) => next(context));
    await router.routes()(
      createRequestContext(RequestMethod.COPY, '/books'),
      async (context) => {
        assert.strictEqual(context.status, 204);
      },
      createHttpContext()
    );
  });

  it('should throw error when input or output guard failed', async () => {
    const run = new Router()
      .post(
        '/books',
        { body: bookGuard.omit({ id: true }), response: bookGuard },
        // @ts-expect-error for testing
        async (context, next) => next(context)
      )
      .routes();
    const book = createBookWithoutId();
    const { name, ...restBook } = book;

    await assert.rejects(
      run(createRequestContext(RequestMethod.POST, '/books', restBook), noop, createHttpContext()),
      z.ZodError
    );
    await assert.rejects(
      run(createRequestContext(RequestMethod.POST, '/books', book), noop, createHttpContext()),
      z.ZodError
    );
  });

  it('should set context with proper status and message when RequestError throws', async () => {
    const run = new Router()
      .get('/books', { response: z.object({ books: bookGuard.array() }) }, () => {
        throw new RequestError('Message 1');
      })
      .get('/books/:id', { response: z.object({ books: bookGuard.array() }) }, () => {
        throw new RequestError('Message 2', 401);
      })
      .routes();

    await run(
      createRequestContext(RequestMethod.GET, '/books'),
      async ({ status, json }) => {
        assert.strictEqual(status, 400);
        assert.deepStrictEqual(json, { message: 'Message 1' });
      },
      createHttpContext()
    );

    await run(
      createRequestContext(RequestMethod.GET, '/books/1'),
      async ({ status, json }) => {
        assert.strictEqual(status, 401);
        assert.deepStrictEqual(json, { message: 'Message 2' });
      },
      createHttpContext()
    );
  });

  it('should pack the given router to the original router when calling `.pack()`', () => {
    const router1 = new Router().get(
      '/books',
      {
        response: z.object({ books: bookGuard.array() }),
      },
      async (context, next) => {
        return next({ ...context, json: { books: [] } });
      }
    );
    const router2 = new Router()
      .get('/books/:id', { response: bookGuard }, async (context, next) => {
        return next({ ...context, json: createBook() });
      })
      .pack(router1)
      .post(
        '/books',
        { body: bookGuard.omit({ id: true }), response: bookGuard },
        async (context, next) => {
          return next({ ...context, json: createBook() });
        }
      );

    const router3 = router1.pack(router2);

    assert.ok(router2.findHandler('get', '/books'));
    assert.ok(router2.findHandler('get', '/books/:id'));
    assert.ok(router2.findHandler('post', '/books'));

    assert.strictEqual(router1, router3);
    assert.ok(router3.findHandler('get', '/books'));
    assert.ok(router3.findHandler('get', '/books/:id'));
    assert.ok(router3.findHandler('post', '/books'));
  });
});
