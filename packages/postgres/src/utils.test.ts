import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Model, ModelRouter } from '@withtyped/server';
import sinon from 'sinon';
import { z } from 'zod';

import PostgresQueryClient from './query-client.js';
import { createModelRouter } from './utils.js';

class FakeQueryClient extends PostgresQueryClient {
  connect = sinon.stub();
  end = sinon.stub();
  query = sinon.stub();
}

describe('createModelRouter()', () => {
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

  it('should not explode', () => {
    const fakeQueryClient = new FakeQueryClient();
    const router = createModelRouter(forms, fakeQueryClient);

    assert.ok(router instanceof ModelRouter);
    assert.strictEqual(router.model, forms);
  });

  it('should throw for invalid table name or ID key', () => {
    const fakeQueryClient = new FakeQueryClient();
    assert.throws(
      () => createModelRouter(Model.create('create table foo:bar ();'), fakeQueryClient),
      (error: unknown) =>
        error instanceof TypeError && error.message.includes('includes invalid char')
    );
    assert.throws(
      // @ts-expect-error for testing
      () => createModelRouter(Model.create('create table foobar ();'), fakeQueryClient, 'foo'),
      (error: unknown) =>
        error instanceof TypeError && error.message.includes('is not a valid ID key')
    );
  });
});
