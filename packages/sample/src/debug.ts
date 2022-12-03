import { faker } from '@faker-js/faker';
import createServer, { RequestError, Router } from '@withtyped/server';
import { createComposer } from '@withtyped/server/lib/preset.js';
import {
  zodTypeToParameters,
  zodTypeToSwagger,
} from '@withtyped/server/lib/test-utils/openapi.test.js';
import { z } from 'zod';

import type { Book } from './book.js';
import { bookGuard, createBook } from './book.js';

// eslint-disable-next-line @silverhand/fp/no-let
let books = Array.from({ length: 10 }).map(() => createBook());

const getRouter = new Router()
  .get(
    '/books',
    {
      response: z.object({ books: bookGuard.array() }),
    },
    async (context, next) => {
      return next({ ...context, json: { books } });
    }
  )
  .get('/books/:id', { response: bookGuard }, async (context, next) => {
    const book = books.find(({ id }) => id === context.request.params.id);

    if (!book) {
      throw new RequestError(`No book with ID ${context.request.params.id} found`, 404);
    }

    return next({ ...context, json: book });
  });

export const router = new Router()
  .pack(getRouter)
  .post(
    '/books',
    { body: bookGuard.omit({ id: true }), response: bookGuard },
    async (context, next) => {
      const book: Book = { id: faker.datatype.uuid(), ...context.request.body };
      // eslint-disable-next-line @silverhand/fp/no-mutating-methods
      books.push(book);

      return next({ ...context, json: book });
    }
  )
  .patch(
    '/books/:id',
    { body: bookGuard.omit({ id: true }).partial(), response: bookGuard },
    async (context, next) => {
      const bookIndex = books.findIndex(({ id }) => id === context.request.params.id);

      if (bookIndex < 0) {
        throw new RequestError(`No book with ID ${context.request.params.id} found`, 404);
      }

      // eslint-disable-next-line @silverhand/fp/no-mutation, @typescript-eslint/no-non-null-assertion
      books[bookIndex] = { ...books[bookIndex]!, ...context.request.body };

      return next({ ...context, json: books[bookIndex] });
    }
  )
  .delete('/books/:id', {}, async (context, next) => {
    const newBooks = books.filter(({ id }) => id !== context.request.params.id);

    if (newBooks.length === books.length) {
      throw new RequestError(`No book with ID ${context.request.params.id} found`, 404);
    }

    // eslint-disable-next-line @silverhand/fp/no-mutation
    books = newBooks;

    return next(context);
  })
  .get(
    '/search',
    { search: z.object({ name: z.string() }), response: z.object({ books: bookGuard.array() }) },
    async (context, next) => {
      return next({
        ...context,
        json: { books: books.filter(({ name }) => name.includes(context.request.search.name)) },
      });
    }
  )
  .withOpenApi(zodTypeToParameters, zodTypeToSwagger);

const server = createServer({ composer: createComposer().and(router.routes()) });

await server.listen(() => {
  console.log('Listening', 9001);
});
