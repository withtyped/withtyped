import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import { Router } from '@withtyped/server';
import { contentTypes, log, lowerRequestMethods, noop } from '@withtyped/shared';
import sinon from 'sinon';
import { z } from 'zod';

import Client, { ResponseError, RequestMethod } from './index.js';
import { buildSearch } from './utils.js';

export const bookGuard = z.object({
  id: z.string(),
  name: z.string(),
  authors: z.object({ name: z.string(), email: z.string().optional() }).array(),
  price: z.number(),
});

const router = new Router('/books')
  .get('/', { response: bookGuard.array() }, noop)
  .get('/error', {}, noop)
  .patch('/:id', { response: bookGuard }, noop)
  .post(
    '/ok',
    {
      body: z.object({
        foo: z.number(),
        bar: z.boolean(),
        baz: z.object({ key1: z.string() }).array(),
      }),
    },
    noop
  )
  .delete('/:what/:ever', { search: z.object({ foo: z.string(), bar: z.string().array() }) }, noop);

const baseUrl = new URL('https://localhost');
const errorResponse = new Response('{ "message": "Not ok" }', { status: 400 });
const fakeFetch = sinon.stub(global, 'fetch').callsFake(async (input, init) => {
  log.debug('fetch', input, init);

  if (
    (input instanceof URL ? input.toString() : input instanceof Request ? input.url : input) ===
    'https://localhost/books/error'
  ) {
    return errorResponse;
  }

  // For testing
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { ok: true, json: async () => ({ origin: 'fakeFetch' }) } as Response;
});

const withPath = (path: string) => new URL(path, baseUrl);

void describe('Client', () => {
  beforeEach(() => {
    fakeFetch.resetHistory();
  });

  void it('should not explode', () => {
    assert.ok(new Client(baseUrl.toString()));
    assert.ok(new Client(baseUrl));
  });

  void it('should support all available request methods', () => {
    const client = new Client(baseUrl);

    for (const method of lowerRequestMethods) {
      assert.ok(typeof client[method] === 'function');
    }
  });

  void it('should send with static custom headers', async () => {
    const client = new Client<typeof router>({
      baseUrl,
      headers: { authorization: 'top-secret' },
    });

    await client.get('/books');

    assert.ok(
      fakeFetch.calledOnceWith(withPath('/books'), {
        method: RequestMethod.GET,
        headers: { host: baseUrl.host, accept: contentTypes.json, authorization: 'top-secret' },
        body: undefined,
      })
    );
  });

  void it('should send with dynamic custom headers', async () => {
    const client = new Client<typeof router>({
      baseUrl,
      headers: (url, method) => ({ foo: url.pathname, bar: method }),
    });

    await client.get('/books');

    assert.ok(
      fakeFetch.calledOnceWith(withPath('/books'), {
        method: RequestMethod.GET,
        headers: { host: baseUrl.host, accept: contentTypes.json, foo: '/books', bar: 'get' },
        body: undefined,
      })
    );
  });

  void it('should send with dynamic promise custom headers', async () => {
    const client = new Client<typeof router>({
      baseUrl,
      headers: async (url, method) => ({ foo: url.pathname, bar: method }),
    });

    await client.get('/books');

    assert.ok(
      fakeFetch.calledOnceWith(withPath('/books'), {
        method: RequestMethod.GET,
        headers: { host: baseUrl.host, accept: contentTypes.json, foo: '/books', bar: 'get' },
        body: undefined,
      })
    );
  });

  void it('should throw when path is not string', async () => {
    const client = new Client<typeof router>(baseUrl);

    // @ts-expect-error for testing
    await assert.rejects(client.get(123), new TypeError('Path is not string'));
  });

  void it('should throw when response is not ok', async () => {
    const client = new Client<typeof router>(baseUrl);

    await assert.rejects(client.get('/books/error'), (error) => {
      return (
        error instanceof ResponseError && error.status === 400 && error.response === errorResponse
      );
    });
  });

  void it('should be able to send URL parameters', async () => {
    const client = new Client<typeof router>(baseUrl);

    await client.patch('/books/:id', { params: { id: '123' } });

    assert.ok(
      fakeFetch.calledOnceWith(withPath('/books/123'), {
        method: RequestMethod.PATCH,
        headers: { host: baseUrl.host, accept: contentTypes.json },
        body: undefined,
      })
    );
  });

  void it('should be able to send search parameters', async () => {
    const client = new Client<typeof router>(baseUrl);
    const search = { foo: 's1=&&&', bar: ['s2', 's2'] };

    await client.delete('/books/:what/:ever', {
      params: { what: '123', ever: '234' },
      search,
    });

    assert.ok(
      fakeFetch.calledOnceWith(withPath('/books/123/234?' + buildSearch(search).toString()), {
        method: RequestMethod.DELETE,
        headers: { host: baseUrl.host, accept: contentTypes.json },
        body: undefined,
      })
    );
  });

  void it('should throw when URL parameter is missing', async () => {
    const client = new Client<typeof router>(baseUrl);
    const search = { foo: 's1', bar: ['s2', 's2'] };

    await assert.rejects(
      client.delete('/books/:what/:ever', {
        // @ts-expect-error for testing
        params: { what: '123' },
        search,
      }),
      new TypeError('URL parameter `ever` not found')
    );
  });

  void it('should stringify body and send', async () => {
    const client = new Client<typeof router>(baseUrl);
    const body = {
      foo: 123,
      bar: true,
      baz: [{ key1: '1' }, { key1: '2' }],
    };

    await client.post('/books/ok', {
      body,
    });

    assert.ok(
      fakeFetch.calledOnceWith(withPath('/books/ok'), {
        method: RequestMethod.POST,
        headers: {
          host: baseUrl.host,
          accept: contentTypes.json,
          'content-type': contentTypes.json,
        },
        body: JSON.stringify(body),
      })
    );
  });
});

void describe('Client hooks', () => {
  beforeEach(() => {
    fakeFetch.resetHistory();
  });

  void it('should throw when hook returns error', async () => {
    const client = new Client<typeof router>({
      baseUrl,
      before: {
        error: () => new Error('Hook error'),
      },
    });

    await assert.rejects(client.get('/books/error'), new Error('Hook error'));
  });

  void it('should throw when hook returns promise error', async () => {
    const client = new Client<typeof router>({
      baseUrl,
      before: {
        error: async () => new Error('Hook error'),
      },
    });

    await assert.rejects(client.get('/books/error'), new Error('Hook error'));
  });

  void it('should throw original error when hook returns non-error', async () => {
    const client = new Client<typeof router>({
      baseUrl,
      before: {
        error: () => 'Hook error',
      },
    });

    await assert.rejects(client.get('/books/error'), new ResponseError(errorResponse));
  });

  void it('should throw original error when hook returns promise non-error', async () => {
    const client = new Client<typeof router>({
      baseUrl,
      before: {
        error: async () => 'Hook error',
      },
    });

    await assert.rejects(client.get('/books/error'), new ResponseError(errorResponse));
  });
});
