import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ModelClientError } from '@withtyped/server';
import Model from '@withtyped/server/model';
import { normalizeString } from '@withtyped/shared';
import sinon from 'sinon';
import { z } from 'zod';

import { PostgreSql, PostgresQueryClient } from './index.js'; // Intended. Cover export-only index file
import PostgresModelClient, { createModelClient } from './model-client.js';

class FakeQueryClient extends PostgresQueryClient {
  connect = sinon.stub();
  end = sinon.stub();
  query = sinon.stub().resolves({
    rows: [
      {
        id: 'foo',
        remote_address: null,
        headers: {},
        data: { foo: '1', bar: 2 },
        data_2: null,
        num: null,
        test: [],
        created_at: new Date(),
      },
    ],
    rowCount: 1,
  });
}

describe('PostgresModelClient', () => {
  const forms = Model.create(
    /* Sql */ `
    CREATE table forms (
      id VARCHAR(32) not null,
      remote_address varchar(128),
      headers jsonb not null,
      data jsonb,
      data_2 bigint,
      num bigint array,
      test decimal not null array default([]),
      created_at timestamptz not null default(now())
    );`
  )
    .extend('data', z.object({ foo: z.string(), bar: z.number().optional() }))
    .extend('data2', z.number().gt(10).nullable());

  it('should call query client methods accordingly', () => {
    const fakeQueryClient = new FakeQueryClient();
    const client = new PostgresModelClient(Model.create(`create table tests ();`), fakeQueryClient);

    void client.connect();
    void client.end();

    assert.deepStrictEqual(
      [
        fakeQueryClient.connect.calledOnceWithExactly(),
        fakeQueryClient.end.calledOnceWithExactly(),
      ],
      [true, true]
    );
  });

  it('should call `.create()` and perform query properly', async () => {
    const fakeQueryClient = new FakeQueryClient();
    const client = createModelClient(forms, fakeQueryClient);

    await client.create({
      id: 'foo',
      remoteAddress: null,
      headers: {},
      data: { foo: '1' },
      data2: 123,
      num: [111],
      test: undefined,
      createdAt: undefined,
    });

    const data: unknown = fakeQueryClient.query.args[0]?.[0];
    assert.ok(data instanceof PostgreSql);

    const { raw, args } = data.composed;
    assert.strictEqual(
      normalizeString(raw),
      'insert into "forms" ("id", "remote_address", "headers", "data", "data_2", "num") ' +
        'values ($1, $2, $3::json, $4::json, $5, $6::json) ' +
        'returning "id", "remote_address", "headers", "data", "data_2", "num", "test", "created_at"'
    );
    assert.deepStrictEqual(args, [
      'foo',
      null,
      JSON.stringify({}),
      JSON.stringify({ foo: '1' }),
      123,
      JSON.stringify([111]),
    ]);
  });

  it('should call `.readAll()` and perform query properly', async () => {
    const fakeQueryClient = new FakeQueryClient();
    const client = createModelClient(forms, fakeQueryClient);

    await client.readAll();

    const data: unknown = fakeQueryClient.query.args[0]?.[0];
    assert.ok(data instanceof PostgreSql);

    const { raw, args } = data.composed;
    assert.strictEqual(
      normalizeString(raw),
      'select "id", "remote_address", "headers", "data", "data_2", "num", "test", "created_at" from "forms"'
    );
    assert.deepStrictEqual(args, []);
  });

  it('should call `.read()` and perform query properly', async () => {
    const fakeQueryClient = new FakeQueryClient();
    const client = createModelClient(forms, fakeQueryClient);

    // Convert to incoming string to number
    await client.read('data2', '123');

    const data: unknown = fakeQueryClient.query.args[0]?.[0];
    assert.ok(data instanceof PostgreSql);

    const { raw, args } = data.composed;
    assert.strictEqual(
      normalizeString(raw),
      'select "id", "remote_address", "headers", "data", "data_2", "num", "test", "created_at" from "forms" where "data_2"=$1'
    );
    assert.deepStrictEqual(args, [123]);

    await assert.rejects(
      client.read('remote_address', 'foo'), // Should be camelCase key
      new ModelClientError('key_not_found')
    );
    await assert.rejects(
      client.read('headers', '{}'),
      new TypeError('Key in where clause must map to a string or number value')
    );

    fakeQueryClient.query.resolves({ rows: [], rowCount: 0 });
    await assert.rejects(client.read('id', 'foo'), new ModelClientError('entity_not_found'));
  });

  it('should call `.update()` and perform query properly', async () => {
    const fakeQueryClient = new FakeQueryClient();
    const client = createModelClient(forms, fakeQueryClient);

    await client.update('id', 'foo', {
      id: '111',
      headers: { foo: 'bar' },
      createdAt: new Date(12_345),
    });

    const data: unknown = fakeQueryClient.query.args[0]?.[0];
    assert.ok(data instanceof PostgreSql);

    const { raw, args } = data.composed;
    assert.strictEqual(
      normalizeString(raw),
      'update "forms" ' +
        'set "id"=$1, "headers"=$2::json, "created_at"=$3 ' +
        'where "id"=$4 ' +
        'returning "id", "remote_address", "headers", "data", "data_2", "num", "test", "created_at"'
    );
    assert.deepStrictEqual(args, ['111', JSON.stringify({ foo: 'bar' }), new Date(12_345), 'foo']);

    await assert.rejects(client.update('id1', 'foo', {}), new ModelClientError('key_not_found'));

    fakeQueryClient.query.resolves({ rows: [], rowCount: 0 });
    await assert.rejects(client.update('id', 'foo', {}), new ModelClientError('entity_not_found'));
  });

  it('should call `.delete()` and perform query properly', async () => {
    const fakeQueryClient = new FakeQueryClient();
    const client = createModelClient(forms, fakeQueryClient);

    assert.ok(await client.delete('id', 'foo'));

    const data: unknown = fakeQueryClient.query.args[0]?.[0];
    assert.ok(data instanceof PostgreSql);

    const { raw, args } = data.composed;
    assert.strictEqual(normalizeString(raw), 'delete from "forms" where "id"=$1');
    assert.deepStrictEqual(args, ['foo']);

    await assert.rejects(client.delete('data_2', 'foo'), new ModelClientError('key_not_found'));
  });
});
