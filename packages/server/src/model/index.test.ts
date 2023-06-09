import assert from 'node:assert';
import { describe, it } from 'node:test';

import { z, ZodError } from 'zod';

import type { InferModelType } from './index.js';
import Model from './index.js';

describe('Model class', () => {
  const forms = Model.create(
    /* Sql */ `
    cREaTe taBle forms (
      id VARCHAR(32) not null,
      remote_address varchar(128),
      headers jsonb not null,
      data jsonb,
      data_2 bigint,
      to_exclude varchar(12) not null,
      num bigint array,
      test decimal not null array default([]),
      created_at timestamptz not null default(now())
    );`
  )
    .extend('toExclude', z.string().optional())
    .exclude('toExclude')
    .extend('data', z.object({ foo: z.string(), bar: z.number() }))
    .extend('data2', z.number().gt(10).nullable())
    .extend('num', { default: () => [1, 2, 3], readonly: true })
    .extend('test', { default: [2, 3, 4] });

  type Forms = InferModelType<typeof forms>;

  it('should construct proper class', () => {
    const baseData = {
      id: 'foo',
      headers: {},
      data: { foo: 'foo', bar: 1 },
      data2: null,
    } satisfies Partial<Forms>;

    assert.deepStrictEqual(forms.rawKeys, {
      id: 'id',
      remoteAddress: 'remote_address',
      headers: 'headers',
      data: 'data',
      data2: 'data_2',
      num: 'num',
      test: 'test',
      createdAt: 'created_at',
    });

    const parse1 = Object.freeze({
      id: 'foo',
      headers: {},
      data: { foo: 'foo', bar: 1 },
      test: [],
      toExclude: 'ok',
    });
    const expect1 = Object.freeze({
      id: 'foo',
      headers: {},
      data: { foo: 'foo', bar: 1 },
      test: [],
    });
    assert.deepStrictEqual(forms.parse(parse1, 'patch'), expect1);
    assert.deepStrictEqual(forms.getGuard('patch').parse(parse1), expect1);

    assert.deepStrictEqual(forms.parse({ ...baseData, headers: { bar: 'foo' } }, 'patch'), {
      id: 'foo',
      headers: { bar: 'foo' },
      data: { foo: 'foo', bar: 1 },
      data2: null,
    });

    const parse2 = Object.freeze({ ...baseData, remoteAddress: null });
    const expect2 = Object.freeze({
      id: 'foo',
      remoteAddress: null,
      headers: {},
      data: { foo: 'foo', bar: 1 },
      data2: null,
      num: [1, 2, 3],
      test: [2, 3, 4],
    });
    assert.deepStrictEqual(forms.parse(parse2, 'create'), expect2);
    assert.deepStrictEqual(forms.guard('create').parse(parse2), expect2);

    const parse3 = Object.freeze({
      ...baseData,
      remote_address: null,
      num: null,
      test: [456, 789],
      created_at: new Date(123_123_123),
    });
    const expect3 = Object.freeze({
      id: 'foo',
      remoteAddress: null,
      headers: {},
      data: { foo: 'foo', bar: 1 },
      data2: null,
      num: null,
      test: [456, 789],
      createdAt: new Date(123_123_123),
    });
    assert.deepStrictEqual(forms.parse(parse3), expect3);
    // The raw guard does not transform key cases, only `.parse()` does
    assert.throws(() => forms.guard().parse(parse3), ZodError);
    assert.throws(() => forms.parse({ ...baseData, remote_address: 123 }), ZodError);
    assert.throws(() => forms.parse({ ...baseData, headers: undefined }), ZodError);
    assert.throws(
      () => forms.parse({ ...baseData, remoteAddress: null, num: [321_321_321] }, 'create'),
      ZodError
    );
  });

  it('should allow fields with database default value to be readonly', () => {
    const forms = Model.create(
      /* Sql */ `
      create table forms (
        id VARCHAR(32) not null,
        created_at timestamptz not null default(now())
      );`
    ).extend('createdAt', { readonly: true });
    assert.deepStrictEqual(forms.guard('create').parse({ id: 'foo' }), {
      id: 'foo',
    });
    assert.deepStrictEqual(forms.guard('patch').parse({ id: 'bar', createdAt: undefined }), {
      id: 'bar',
      createdAt: undefined,
    });
    assert.throws(() => forms.guard('patch').parse({ id: 'baz', createdAt: new Date() }), ZodError);
  });

  it('should throw error when table name is missing in query', () => {
    assert.throws(
      () =>
        Model.create(/* Sql */ `
      CREATE table  ( 
        id VARCHAR(32) not null
      );
    `),
      new TypeError('Table name not found in query')
    );
  });

  it('should throw error when needed', () => {
    assert.throws(() => forms.parse(null), ZodError);
    assert.throws(
      () => forms.parse({ id: null, data: { foo: 'foo', bar: 1 }, data2: null }, 'create'),
      ZodError
    );
    assert.throws(
      () =>
        forms.parse(
          {
            id: 'foo',
            headers: {},
            remoteAddress: null,
            data2: 100,
            data: { foo: 'foo', bar: 1 },
            test: [false],
          },
          'create'
        ),
      ZodError
    );
    assert.throws(
      () =>
        forms.parse(
          {
            id: 'foo',
            headers: {},
            remoteAddress: null,
            num: null,
            data: { foo: 'foo', bar: 1 },
          },
          'create'
        ),
      ZodError
    );
  });

  it('should use customized parser even for primitive columns', () => {
    const baseData = {
      id: 'foo',
      headers: { bar: 'foo' },
      data: { foo: 'foo', bar: 1 },
      data_2: 120,
    };

    assert.deepStrictEqual(forms.parse(baseData, 'patch'), {
      id: 'foo',
      headers: { bar: 'foo' },
      data: { foo: 'foo', bar: 1 },
      data2: 120,
    });

    assert.throws(() => forms.parse({ ...baseData, data2: 10 }, 'patch'), ZodError);
  });
});
