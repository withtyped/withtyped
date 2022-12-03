import assert from 'node:assert';
import { describe, it } from 'node:test';

import { noop, RequestMethod } from '@withtyped/shared';
import sinon from 'sinon';

import RequestError from '../errors/RequestError.js';
import Model from '../model/index.js';
import { createHttpContext } from '../test-utils/http.test.js';
import TestModelClient from './client.test.js';
import ModelRouter from './index.js';

const buildUrl = (path: string) => new URL(path, 'https://logto.io');

describe('ModelRouter', () => {
  it('should fall back to `id` when no ID key specified', () => {
    const sql = `create table tests (id int64 not null);`;
    assert.ok(new ModelRouter(new TestModelClient(Model.create(sql)), '/tests'));
  });

  it('should throw TypeError when `id` is not available for the ID key', () => {
    const sql = `create table tests (foo bool not null);`;

    assert.throws(
      () => new ModelRouter(new TestModelClient(Model.create(sql)), '/tests'),
      new TypeError(
        'No ID key provided while the default key `id` is not a valid ID key in this model.\n' +
          'A valid ID key should have a string value in the model.'
      )
    );
  });

  it('should be able to specify a valid ID key and read with that key', async () => {
    const sql = `create table tests (foo varchar(128) not null);`;
    assert.ok(new ModelRouter(new TestModelClient(Model.create(sql)), '/tests', 'foo'));
  });

  it('should be able to create after calling `.withCreate()`', async () => {
    const httpContext = createHttpContext();
    const sql = `create table tests (id varchar(128) not null);`;
    const client = new TestModelClient(Model.create(sql));
    const router = new ModelRouter(client, '/tests');
    const run = router.withCreate().routes();

    await run(
      {
        request: {
          method: RequestMethod.POST,
          url: buildUrl('/tests'),
          headers: {},
          body: { id: 'foo' },
        },
      },
      async (context) => {
        client.create.calledOnceWithExactly({ id: 'foo' });
        assert.deepStrictEqual(context.json, { action: 'create' });
      },
      httpContext
    );
  });

  it('should be able to read and read all after calling `.withRead()`', async () => {
    const httpContext = createHttpContext();
    const sql = `create table tests (foo varchar(128) not null);`;
    const client = new TestModelClient(Model.create(sql));
    const router = new ModelRouter(client, '/tests', 'foo');
    const run = router.withRead().routes();

    await Promise.all([
      run(
        { request: { method: RequestMethod.GET, url: buildUrl('/tests/123'), headers: {} } },
        async (context) => {
          client.read.calledOnceWithExactly('foo', '123');
          assert.deepStrictEqual(context.json, { action: 'read' });
        },
        httpContext
      ),
      run(
        { request: { method: RequestMethod.GET, url: buildUrl('/tests'), headers: {} } },
        async (context) => {
          assert.ok(client.readAll.calledOnce);
          assert.deepStrictEqual(context.json, { action: 'readAll' });
        },
        httpContext
      ),
    ]);
  });

  it('should be able to update by id after calling `.withUpdate()`', async () => {
    const httpContext = createHttpContext();
    const sql = `create table tests (foo varchar(128) not null, bar int64);`;
    const client = new TestModelClient(Model.create(sql));
    const router = new ModelRouter(client, '/tests', 'foo');
    const run = router.withUpdate().routes();

    await run(
      {
        request: {
          method: RequestMethod.PATCH,
          url: buildUrl('/tests/123'),
          headers: {},
          body: { bar: 128 },
        },
      },
      async (context) => {
        client.update.calledOnceWithExactly('foo', '123', { bar: 128 });
        assert.deepStrictEqual(context.json, { action: 'update' });
      },
      httpContext
    );

    client.update.resetHistory();
    await run(
      {
        request: {
          method: RequestMethod.PUT,
          url: buildUrl('/tests/123'),
          headers: {},
          body: { foo: 'abc', bar: 256 },
        },
      },
      async (context) => {
        client.update.calledOnceWithExactly('foo', '123', { foo: 'abc', bar: 256 });
        assert.deepStrictEqual(context.json, { action: 'update' });
      },
      httpContext
    );
  });

  it('should be able to delete by id after calling `.withDelete()`', async () => {
    const httpContext = createHttpContext();
    const sql = `create table tests (foo varchar(128) not null, bar int64);`;
    const client = new TestModelClient(Model.create(sql));
    const router = new ModelRouter(client, '/tests', 'foo');
    const run = router.withDelete().routes();

    client.delete.onSecondCall().resolves(false);

    await run(
      {
        request: {
          method: RequestMethod.DELETE,
          url: buildUrl('/tests/123'),
          headers: {},
        },
      },
      async (context) => {
        client.delete.calledOnceWithExactly('foo', '123');
        // eslint-disable-next-line unicorn/no-useless-undefined
        assert.deepStrictEqual(context.json, undefined);
      },
      httpContext
    );
    await assert.rejects(
      run(
        {
          request: {
            method: RequestMethod.DELETE,
            url: buildUrl('/tests/123'),
            headers: {},
          },
        },
        noop,
        httpContext
      ),
      RequestError
    );
  });

  it('should call CRUD methods after calling `.withCrud()`', async () => {
    const sql = `create table tests (id int64 not null);`;
    const router = new ModelRouter(new TestModelClient(Model.create(sql)), '/tests');
    const [withCreate, withRead, withUpdate, withDelete] = [
      sinon.spy(router, 'withCreate'),
      sinon.spy(router, 'withRead'),
      sinon.spy(router, 'withUpdate'),
      sinon.spy(router, 'withDelete'),
    ];

    router.withCrud();
    assert.ok([
      withCreate.calledOnce,
      withRead.calledOnce,
      withUpdate.calledOnce,
      withDelete.calledOnce,
    ]);
  });
});
