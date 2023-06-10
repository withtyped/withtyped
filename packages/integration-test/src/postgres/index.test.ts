import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';

import { PostgresInitializer, PostgreSql, PostgresQueryClient, sql } from '@withtyped/postgres';
import Model from '@withtyped/server/model';
import { z } from 'zod';

import { createDatabaseName } from '../utils/database.js';

describe('Postgres data model', () => {
  const database = createDatabaseName();
  const queryClient = new PostgresQueryClient({ database });
  const initClient = new PostgresInitializer([], queryClient);
  const forms = Model.create(
    /* Sql */ `
    CREATE table forms (
      id VARCHAR(32) not null,
      remote_address varchar(128),
      headers jsonb not null,
      data jsonb,
      data_2 bigint,
      num bigint array,
      test decimal array not null default(array[]::decimal[]),
      created_at timestamptz not null default(now())
    );`
  )
    .extend('data', z.object({ foo: z.string(), bar: z.number() }))
    .extend('data2', z.number().gt(10).nullable());

  before(async () => {
    await initClient.initialize();
  });

  after(async () => {
    await initClient.destroy();
  });

  it('should be able to create table per model', async () => {
    await queryClient.query(new PostgreSql(Object.assign([forms.raw], { raw: [forms.raw] }), []));
    const { rows } = await queryClient.query(
      sql`select to_regclass(${forms.tableName}) as regclass`
    );

    assert.ok(rows[0]?.regclass);
  });
});
