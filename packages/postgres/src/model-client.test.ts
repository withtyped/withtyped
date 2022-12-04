import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Model } from '@withtyped/server';
import sinon from 'sinon';
import { z } from 'zod';

import { PostgresQueryClient } from './index.js'; // Intended. Cover export-only index file
import PostgresModelClient from './model-client.js';

class FakeQueryClient extends PostgresQueryClient {
  connect = sinon.stub();
  end = sinon.stub();
  query = sinon.stub();
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
});
