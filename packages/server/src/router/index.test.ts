import assert from 'node:assert';
import { describe, it } from 'node:test';

import { noop, RequestMethod } from '@withtyped/shared';
import OpenAPISchemaValidator from 'openapi-schema-validator';
import sinon from 'sinon';
import { z } from 'zod';

import RequestError from '../errors/RequestError.js';
import { type RequestContext } from '../index.js';
import { type NextFunction, type MiddlewareFunction } from '../middleware.js';
import { bookGuard, createBook, createBookWithoutId } from '../test-utils/entities.test.js';
import { createHttpContext, createRequestContext } from '../test-utils/http.test.js';
import { zodTypeToParameters, zodTypeToSwagger } from '../test-utils/openapi.test.js';

import Router, { createRouter } from './index.js';

void describe('Router', () => {
  void it('should provide a middleware function to call the provided middleware function with request context', async () => {
    const [mid1, mid2, mid3] = [sinon.fake(), sinon.fake(), sinon.fake()];
    const router1 = new Router()
      .get('/books', { response: z.object({ books: bookGuard.array() }) }, mid1)
      .delete('/books/:id', { response: bookGuard }, mid2);
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
    assert.strictEqual(mid1.calledOnceWith(sinon.match(context1), sinon.match.func), true);

    await Promise.all([
      run(context2, noop, httpContext),
      run(context3, noop, httpContext),
      run(context4, noop, httpContext),
    ]);
    assert.strictEqual(mid1.callCount, 1);
    assert.strictEqual(mid1.calledOnceWith(sinon.match(context1), sinon.match.func), true);
    assert.strictEqual(mid2.callCount, 1);
    assert.strictEqual(mid2.calledOnceWith(sinon.match(context2), sinon.match.func), true);
    assert.strictEqual(mid3.callCount, 1);
    assert.strictEqual(
      mid3.calledOnceWith(sinon.match({ ...context3, guarded: { params: {} } }), sinon.match.func),
      true
    );
  });

  void it('should be able to add general middleware functions using `.use()`', async () => {
    const mid1 = sinon.fake(async (context, next) =>
      next({ ...context, foo: 'bar' })
    ) satisfies MiddlewareFunction<RequestContext, RequestContext & { foo: string }>;
    const mid2 = sinon.fake(async (context, next) =>
      next({ ...context, bar: 123 })
    ) satisfies MiddlewareFunction<
      RequestContext & { foo: string },
      RequestContext & { foo: string; bar: number }
    >;
    const handler = sinon.fake(async (context, next) => next(context)) satisfies MiddlewareFunction<
      RequestContext & { foo: string; bar: number },
      RequestContext & { foo: string; bar: number }
    >;

    const router1 = new Router().use(mid1).use(mid2).get('/books', {}, handler);
    const context1 = createRequestContext(RequestMethod.GET, '/books');
    const run = router1.routes();
    const httpContext = createHttpContext();

    await run(context1, noop, httpContext);
    assert.strictEqual(mid1.calledOnceWith(sinon.match(context1), sinon.match.func), true);
    assert.strictEqual(
      mid2.calledOnceWith(sinon.match({ ...context1, foo: 'bar' }), sinon.match.func),
      true
    );
    assert.strictEqual(
      handler.calledOnceWith(sinon.match({ ...context1, foo: 'bar', bar: 123 }), sinon.match.func),
      true
    );
  });

  void it('should throw error when using `.use()` after adding routes', () => {
    const mid1 = sinon.fake(async (context, next) =>
      next({ ...context, foo: 'bar' })
    ) satisfies MiddlewareFunction<RequestContext, RequestContext & { foo: string }>;
    const handler = sinon.fake(async (context, next) => next(context)) satisfies MiddlewareFunction<
      RequestContext,
      RequestContext
    >;

    assert.throws(
      () => new Router().get('/books', {}, handler).use(mid1),
      Error,
      'Middleware must be added before adding routes'
    );

    const router = new Router().get('/books', {}, handler);

    assert.throws(
      () => new Router().pack(router).use(mid1),
      Error,
      'Middleware must be added before adding routes'
    );
  });

  void it('should throw error when using `.pack()` with a router that has middleware', () => {
    const mid1 = sinon.fake(async (context, next) =>
      next({ ...context, foo: 'bar' })
    ) satisfies MiddlewareFunction<RequestContext, RequestContext & { foo: string }>;
    const handler = sinon.fake(async (context, next) => next(context)) satisfies MiddlewareFunction<
      RequestContext & { foo: string },
      RequestContext & { foo: string }
    >;

    const router1 = new Router().use(mid1).get('/books', {}, handler);
    const router2 = new Router<RequestContext & { foo: string }, RequestContext & { foo: string }>()
      .use(mid1)
      .get('/books', {}, handler);

    assert.throws(() => router1.pack(router2), Error, 'Another router must not have middleware');
  });

  void it('should be able to pack another router after `.use().pack()` and execute the middleware functions for the packed router', async () => {
    const mid = sinon.fake(async (context, next) =>
      next({ ...context, bar: 123 })
    ) satisfies MiddlewareFunction<RequestContext, RequestContext & { bar: number }>;
    const handler = sinon.fake(async (context, next) => next(context)) satisfies MiddlewareFunction<
      RequestContext,
      RequestContext
    >;

    const router1 = new Router().get('/books', {}, handler);
    const router2 = new Router().use(mid).pack(router1);
    const context1 = createRequestContext(RequestMethod.GET, '/books');
    const run = router2.routes();
    const httpContext = createHttpContext();

    await run(context1, noop, httpContext);
    assert.strictEqual(mid.calledOnceWith(sinon.match(context1), sinon.match.func), true);
    assert.strictEqual(
      handler.calledOnceWith(sinon.match({ ...context1, bar: 123 }), sinon.match.func),
      true
    );
  });

  void it('should respond with parsed json when the route matches', async () => {
    const router = new Router().get(
      '/books',
      { response: z.object({ foo: z.string() }) },
      // @ts-expect-error for testing
      async (context, next) => next({ ...context, json: { foo: 'bar', bar: 123 } })
    );
    await router.routes()(
      createRequestContext(RequestMethod.GET, '/books'),
      async (context) => {
        assert.strictEqual(context.status, 200);
        assert.deepStrictEqual(context.json, { foo: 'bar' });
      },
      createHttpContext()
    );
  });

  void it('should not call general middleware functions when no route matches', async () => {
    const mid1 = sinon.fake(async (context, next) =>
      next({ ...context, foo: 'bar' })
    ) satisfies MiddlewareFunction<RequestContext, RequestContext & { foo: string }>;
    const handler = sinon.fake(async (context, next) => next(context)) satisfies MiddlewareFunction<
      RequestContext & { foo: string },
      RequestContext & { foo: string }
    >;
    const router1 = new Router().use(mid1).get('/books', {}, handler);
    const context1 = createRequestContext(RequestMethod.GET, '/books1');
    const context2 = createRequestContext(RequestMethod.GET, '/books/1');
    const context3 = createRequestContext(undefined, '/books');

    const run = router1.routes();
    const httpContext = createHttpContext();

    await run(context1, noop, httpContext);
    assert.strictEqual(mid1.notCalled, true);
    assert.strictEqual(handler.notCalled, true);

    await run(context2, noop, httpContext);
    assert.strictEqual(mid1.notCalled, true);
    assert.strictEqual(handler.notCalled, true);

    await run(context3, noop, httpContext);
    assert.strictEqual(mid1.notCalled, true);
    assert.strictEqual(handler.notCalled, true);
  });

  void it('should run multiple middleware functions in chain', async () => {
    const mid1 = sinon.fake((async (context, next) =>
      next({ ...context, foo: 'bar' })) satisfies MiddlewareFunction<
      RequestContext,
      RequestContext & { foo: string }
    >);

    const mid2 = sinon.fake(async (context, next) =>
      next({ ...context, bar: 123 })
    ) satisfies MiddlewareFunction<
      RequestContext & { foo: string },
      RequestContext & { foo: string; bar: number }
    >;

    const mid3 = sinon.fake(async ({ foo, bar, ...rest }, next) =>
      next(rest)
    ) satisfies MiddlewareFunction<RequestContext & { foo: string; bar: number }, RequestContext>;
    const mid4 = sinon.fake(async (context: RequestContext, next: NextFunction<RequestContext>) =>
      next(context)
    );
    const mid5 = sinon.fake(async (context: RequestContext, next: NextFunction<RequestContext>) =>
      next(context)
    );
    const mid6 = sinon.fake();
    const mid7 = sinon.fake();

    const router1 = new Router().get(
      '/books',
      { response: z.object({ books: bookGuard.array() }) },
      mid1,
      mid2,
      mid3,
      mid4,
      mid5,
      // @ts-expect-error test for more middleware functions, they should work in js.
      mid6,
      mid7
    );
    const context1 = createRequestContext(RequestMethod.GET, '/books');

    const run = router1.routes();
    const httpContext = createHttpContext();

    await run(context1, noop, httpContext);

    assert.strictEqual(mid1.calledOnceWith(sinon.match(context1), sinon.match.func), true);
    assert.strictEqual(
      mid2.calledOnceWith(sinon.match({ ...context1, foo: 'bar' }), sinon.match.func),
      true
    );
    assert.strictEqual(
      mid3.calledOnceWith(sinon.match({ ...context1, foo: 'bar', bar: 123 }), sinon.match.func),
      true
    );
    assert.strictEqual(mid4.calledOnceWith(sinon.match(context1), sinon.match.func), true);
    assert.strictEqual(mid5.calledOnceWith(sinon.match(context1), sinon.match.func), true);
    assert.strictEqual(mid6.calledOnceWith(sinon.match(context1), sinon.match.func), true);
    assert.strictEqual(mid7.notCalled, true);
  });

  void it('should set status to 200 with the proper json when everything is ok', async () => {
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

  void it('should set status to 204 when no json returns', async () => {
    const router = new Router().copy('/books', {}, async (context, next) => next(context));
    await router.routes()(
      createRequestContext(RequestMethod.COPY, '/books'),
      async (context) => {
        assert.strictEqual(context.status, 204);
      },
      createHttpContext()
    );
  });

  void it('should throw related error when input or output guard failed', async () => {
    const run = new Router()
      .post(
        '/books',
        {
          search: z.object({}).optional(),
          body: bookGuard.omit({ id: true }),
          response: bookGuard,
        },
        // @ts-expect-error for testing
        async (context, next) => next(context)
      )
      .routes();
    const book = createBookWithoutId();
    const { name, ...restBook } = book;

    await assert.rejects(
      run(createRequestContext(RequestMethod.POST, '/books', restBook), noop, createHttpContext()),
      (error) => error instanceof RequestError && error.status === 400
    );
    await assert.rejects(
      run(createRequestContext(RequestMethod.POST, '/books?foo', book), noop, createHttpContext()),
      z.ZodError
    );
    await assert.rejects(
      run(createRequestContext(RequestMethod.POST, '/books', book), noop, createHttpContext()),
      z.ZodError
    );
  });

  void it('should throws error', async () => {
    const run = createRouter()
      .get('/books', { response: z.object({ books: bookGuard.array() }) }, () => {
        throw new RequestError('Message 1');
      })
      .get('/books/:id', { response: z.object({ books: bookGuard.array() }) }, () => {
        throw new RequestError('Message 2', 401);
      })
      .routes();

    await assert.rejects(
      run(createRequestContext(RequestMethod.GET, '/books'), noop, createHttpContext()),
      new RequestError('Message 1', undefined)
    );

    await assert.rejects(
      run(createRequestContext(RequestMethod.GET, '/books/1'), noop, createHttpContext()),
      new RequestError('Message 2', 401)
    );
  });

  void it('should pack the given router to the original router when calling `.pack()`', () => {
    const router1 = createRouter('/books').get(
      '/books',
      {
        response: z.object({ books: bookGuard.array() }),
      },
      async (context, next) => {
        return next({ ...context, json: { books: [] } });
      }
    );
    const router2 = new Router('/books')
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

    assert.ok(router2.findRoute('get', '/books/books/books'));
    assert.ok(router2.findRoute('get', '/books/books/:id'));
    assert.ok(router2.findRoute('post', '/books/books'));

    assert.strictEqual(router1, router3);
    assert.ok(router1.findRoute('get', '/books/books'));
    // @ts-expect-error for testing
    assert.ok(router1.findRoute('post', '/books/books/books'));
    // @ts-expect-error for testing
    assert.ok(router1.findRoute('get', '/books/books/books/:id'));
    // @ts-expect-error for testing
    assert.ok(router1.findRoute('get', '/books/books/books/books'));
    // @ts-expect-error for testing
    assert.ok(!router1.findRoute('get', '/books/books/:id'));
  });

  void it('should throw when init router with non-normalized prefix', () => {
    // @ts-expect-error for testing
    assert.throws(() => new Router('//'), TypeError);
    // @ts-expect-error for testing
    assert.throws(() => new Router('/'), TypeError);
    // @ts-expect-error for testing
    assert.throws(() => new Router('/foo/:asd'), TypeError);
    // @ts-expect-error for testing
    assert.throws(() => new Router('/foo/bar/'), TypeError);
  });

  void it('should throw when there is no response guard but a response json is provided', async () => {
    const run = new Router()
      .get('/books', {}, async (context, next) => next({ ...context, json: { books: [] } }))
      .routes();

    await assert.rejects(
      run(createRequestContext(RequestMethod.GET, '/books'), noop, createHttpContext()),
      new TypeError('Response guard is required when providing a response json.')
    );
  });

  void it('should do nothing when no route matches', async () => {
    const run = new Router()
      .get('/books', { response: z.object({ books: bookGuard.array() }) }, () => {
        throw new RequestError('Message 1');
      })
      .get('/books/:id', { response: bookGuard }, () => {
        throw new RequestError('Message 2', 401);
      })
      .routes();
    const context1 = createRequestContext(RequestMethod.GET, '/books1');
    const context2 = createRequestContext(RequestMethod.GET, '/books/1/ok');
    const context3 = createRequestContext(undefined, '/books');

    await run(
      context1,
      async (context) => {
        assert.deepStrictEqual(context1, context);
      },
      createHttpContext()
    );
    await run(
      context2,
      async (context) => {
        assert.deepStrictEqual(context2, context);
      },
      createHttpContext()
    );
    await run(
      context3,
      async (context) => {
        assert.deepStrictEqual(context3, context);
      },
      createHttpContext()
    );
  });

  void it('should build proper OpenAPI JSON', async () => {
    const { default: Validator } = OpenAPISchemaValidator;
    const validator = new Validator({ version: 3 });

    const run = new Router()
      .get('/books', { response: z.object({ books: bookGuard.array() }) }, () => {
        throw new RequestError('Message 1');
      })
      .post(
        '/books/:id',
        {
          search: z.object({ key: z.string().optional() }),
          body: bookGuard.partial(),
          response: bookGuard,
        },
        () => {
          throw new RequestError('Message 2', 401);
        }
      )
      .withOpenApi(zodTypeToParameters, zodTypeToSwagger, { title: 'withtyped' })
      .routes();

    await run(
      createRequestContext(RequestMethod.GET, '/openapi.json'),
      async (context) => {
        // @ts-expect-error for validation
        assert.deepStrictEqual(validator.validate(context.json).errors, []);
      },
      createHttpContext()
    );
    // eslint-disable-next-line max-lines
  });
});
