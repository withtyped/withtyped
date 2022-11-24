import assert from 'node:assert';
import { describe, it } from 'node:test';

import Client from '@withtyped/client';

import { createBook } from './book.js';
import type { router } from './debug.js';

const client = new Client<typeof router>('http://localhost:9001');

describe('books', () => {
  it('should return OpenAPI info', async () => {
    const openapi = await client.get('/openapi.json');
    assert.ok(openapi.info.title);
    assert.ok(openapi.info.version);
  });

  it('should return exact 10 books', async () => {
    const { books } = await client.get('/books');
    assert.strictEqual(books.length, 10);
  });

  it('should allow to create and delete a new book with random id', async () => {
    const body = createBook();
    const book = await client.post('/books', { body });
    assert.notStrictEqual(body.id, book.id);

    const { books: newBooks } = await client.get('/books');
    assert.strictEqual(newBooks.length, 11);

    const queryBook = await client.get('/books/:id', { params: { id: book.id } });
    assert.strictEqual(queryBook.id, book.id);

    await client.delete('/books/:id', { params: { id: book.id } });
    const { books } = await client.get('/books');
    assert.strictEqual(books.length, 10);
    assert.ok(books.every(({ id }) => id !== book.id));
  });

  it('throws 404 error when getting a non-existing book', async () => {
    await assert.rejects(
      client.get('/books/:id', { params: { id: '1' } }),
      new Error('Response status 404')
    );
  });

  it('should able to search book by name', async () => {
    const { books } = await client.get('/books');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const book = books[0]!;

    const { books: result } = await client.get('/search', {
      search: { name: book.name.slice(0, 3) },
    });
    assert.ok(result.some(({ id }) => id === book.id));
  });
});
