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
      .post(
        '/books',
        { body: bookGuard.omit({ id: true }), response: bookGuard },
        async (context, next) => {
          return next({ ...context, json: createBook() });
        }
      );

    const router = router1.merge(router2);

    assert.ok(router.handlerFor('get', '/books'));
    assert.ok(router.handlerFor('get', '/books/:id'));
    assert.ok(router.handlerFor('post', '/books'));
  });
});
