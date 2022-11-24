import assert from 'node:assert';
import { describe, it } from 'node:test';

import { z } from 'zod';

import { bookGuard, createBook } from '../test-utils/entities.js';
import Router from './index.js';

describe('Router', () => {
  it('should merge the given router to the original router when calling `.merge()`', () => {
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
      .merge(router1)
      .post(
        '/books',
        { body: bookGuard.omit({ id: true }), response: bookGuard },
        async (context, next) => {
          return next({ ...context, json: createBook() });
        }
      );

    const router3 = router1.merge(router2);

    assert.ok(router2.handlerFor('get', '/books'));
    assert.ok(router2.handlerFor('get', '/books/:id'));
    assert.ok(router2.handlerFor('post', '/books'));

    assert.strictEqual(router1, router3);
    assert.ok(router3.handlerFor('get', '/books'));
    assert.ok(router3.handlerFor('get', '/books/:id'));
    assert.ok(router3.handlerFor('post', '/books'));
  });
});
