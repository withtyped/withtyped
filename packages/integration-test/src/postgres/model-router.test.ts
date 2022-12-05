import assert from 'node:assert';

import Client, { ResponseError } from '@withtyped/client';
import { PostgreSql, createModelRouter, createQueryClient } from '@withtyped/postgres';
import createServer, { Model } from '@withtyped/server';
import { createComposer } from '@withtyped/server/lib/preset.js';
import { after, before, describe, it } from 'node:test';
import { z } from 'zod';

import { createBook } from '../utils/book.js';
import PostgresInitClient, { createDatabaseName } from './init-client.js';

const is404 = (error: unknown) => {
  return error instanceof ResponseError && error.status === 404;
};

describe('ModelRouter', () => {
  const Book = Model.create(
    /* Sql */ `
    create table books (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `
  ).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());
  const database = createDatabaseName();
  const queryClient = createQueryClient({ database });
  const modelRouter = createModelRouter(Book, queryClient).withCrud();
  const initClient = new PostgresInitClient(queryClient);
  const server = createServer({
    queryClients: [queryClient],
    composer: createComposer().and(modelRouter.routes()),
    port: 9002,
  });
  const client = new Client<typeof modelRouter>('http://localhost:9002');

  before(async () => {
    await initClient.initialize();
    await queryClient.query(new PostgreSql(Object.assign([Book.raw], { raw: [Book.raw] }), []));
    await server.listen((port) => {
      console.log('Listening', port);
    });
  });

  after(async () => {
    await server.close();
    await initClient.destroy();
  });

  it('should be able to create and query book', async () => {
    const body = createBook();
    const book = await client.post('/books', {
      body: { ...body, year: null, createdAt: undefined },
    });
    assert.strictEqual(book.id, body.id);

    const { rows: newBooks } = await client.get('/books');
    assert.strictEqual(newBooks.length, 1);
    assert.strictEqual(newBooks[0]?.id, body.id);

    const getBook = await client.get('/books/:id', { params: { id: body.id } });
    assert.strictEqual(getBook.id, body.id);

    await client.delete('/books/:id', { params: { id: body.id } });
    const { rows: books } = await client.get('/books');
    assert.strictEqual(books.length, 0);
  });

  it('should throw 404 error when read/update/delete a non-existing book', async () => {
    await assert.rejects(client.get('/books/:id', { params: { id: '1' } }), is404);
    await assert.rejects(
      client.patch('/books/:id', { params: { id: '1' }, body: { name: 'ok' } }),
      is404
    );
    await assert.rejects(client.delete('/books/:id', { params: { id: '1' } }), is404);
  });

  it('should throw 400 error when update with nothing', async () => {
    await assert.rejects(
      client.patch('/books/:id', { params: { id: '1' }, body: {} }),
      (error: unknown) => {
        return error instanceof ResponseError && error.status === 400;
      }
    );
  });
});
