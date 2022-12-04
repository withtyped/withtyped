import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Model } from '@withtyped/server';
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
    .extend('data', z.object({ foo: z.string(), bar: z.number() }))
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

  it('should call create and perform query properly', async () => {
    const fakeQueryClient = new FakeQueryClient();
    const client = createModelClient(forms, fakeQueryClient);

    await client.create({
      id: 'foo',
      remoteAddress: null,
      headers: {},
      data: { foo: '1', bar: 2 },
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
      JSON.stringify({ foo: '1', bar: 2 }),
      123,
      JSON.stringify([111]),
    ]);
  });
});
