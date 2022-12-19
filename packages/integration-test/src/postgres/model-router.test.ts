import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';

import Client, { ResponseError } from '@withtyped/client';
import { createModelRouter, createQueryClient, PostgresInitializer } from '@withtyped/postgres';
import createServer, { createRouter, Model } from '@withtyped/server';
import { createComposer } from '@withtyped/server/lib/preset.js';
import { nanoid } from 'nanoid';
import OpenAPISchemaValidator from 'openapi-schema-validator';
import { z } from 'zod';

import { createBook } from '../utils/book.js';
import { createDatabaseName } from '../utils/database.js';

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
  )
    .extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array())
    .extend('id', { default: () => nanoid(), readonly: true })
    .extend('year', { default: 2022 });

  const database = createDatabaseName();
  const queryClient = createQueryClient({ database });
  const modelRouter = createModelRouter(Book, queryClient).withCrud();
  const router = createRouter().pack(modelRouter).withOpenApi();
  const initClient = new PostgresInitializer([Book], queryClient);
  const server = createServer({
    queryClients: [queryClient],
    composer: createComposer().and(router.routes()),
    port: 9002,
  });
  const client = new Client<typeof router>('http://localhost:9002');

  before(async () => {
    await initClient.initialize();
    await server.listen((port) => {
      console.log('Listening', port);
    });
  });

  after(async () => {
    await server.close();
    await initClient.destroy();
  });

  it('should be able to return a valid OpenAPI JSON', async () => {
    // @ts-expect-error have to do this, looks like a module loader issue
    const Validator = OpenAPISchemaValidator.default as typeof OpenAPISchemaValidator;

    const validator = new Validator({ version: 3 });
    const json = await client.get('/openapi.json');

    assert.deepStrictEqual(validator.validate(json).errors, []);
  });

  it('should be able to create and query book', async () => {
    const body = createBook();
    const { id } = await client.post('/books', {
      body: { ...body, year: 2, createdAt: new Date() },
    });

    const newBooks = await client.get('/books');
    assert.strictEqual(newBooks.length, 1);
    assert.strictEqual(newBooks[0]?.id, id);

    const getBook = await client.get('/books/:id', { params: { id } });
    assert.strictEqual(getBook.id, id);

    await client.delete('/books/:id', { params: { id } });
    const books = await client.get('/books');
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

  it('should throw 400 error when patch with nothing', async () => {
    const body = createBook();
    const { id } = await client.post('/books', {
      // @ts-expect-error pending compatible work of nullable types with defaults
      body: { ...body, year: null, createdAt: undefined },
    });

    await assert.rejects(
      client.patch('/books/:id', { params: { id }, body: {} }),
      (error: unknown) => {
        return error instanceof ResponseError && error.status === 400;
      }
    );

    await client.delete('/books/:id', { params: { id } });
  });

  it('throws 400 error when patch a readonly field', async () => {
    const body = createBook();
    const { id } = await client.post('/books', { body });

    await assert.rejects(
      // @ts-expect-error for testing
      client.patch('/books/:id', { params: { id }, body: { id: 'foo' } }),
      (error: unknown) => {
        return error instanceof ResponseError && error.status === 400;
      }
    );

    await client.delete('/books/:id', { params: { id } });
  });

  it('should throw 400 error when put with insufficient info', async () => {
    const body = createBook();
    const { id } = await client.post('/books', {
      body: { ...body, year: undefined, createdAt: undefined },
    });

    await assert.rejects(
      // @ts-expect-error for testing
      client.put('/books/:id', { params: { id }, body: { id: '123' } }),
      (error: unknown) => {
        return error instanceof ResponseError && error.status === 400;
      }
    );

    await client.delete('/books/:id', { params: { id } });
  });

  it('should throw 400 error when patch with wrong type', async () => {
    const body = createBook();
    const { id } = await client.post('/books', {
      body: { ...body, year: 2020, createdAt: undefined },
    });

    await assert.rejects(
      // @ts-expect-error for testing
      client.patch('/books/:id', { params: { id }, body: { id: 123 } }),
      (error: unknown) => {
        return error instanceof ResponseError && error.status === 400;
      }
    );

    await client.delete('/books/:id', { params: { id } });
  });
});
