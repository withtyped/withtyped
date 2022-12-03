import assert from 'node:assert';
import { describe, it } from 'node:test';

import { z, ZodError } from 'zod';

import Model from './index.js';

describe('Model class', () => {
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
  );
`
  )
    .extend('data', z.object({ foo: z.string(), bar: z.number() }))
    .extend('data2', z.number().gt(10).nullable().optional());

  it('should construct proper class', () => {
    const baseData = {
      id: 'foo',
      headers: {},
      data: { foo: 'foo', bar: 1 },
      data2: null,
    };

    assert.deepStrictEqual(forms.keys, [
      'id',
      'remoteAddress',
      'headers',
      'data',
      'data2',
      'num',
      'test',
      'createdAt',
    ]);

    assert.deepStrictEqual(
      forms.parse({ id: 'foo', headers: {}, data: { foo: 'foo', bar: 1 } }, 'patch'),
      {
        id: 'foo',
        headers: {},
        data: { foo: 'foo', bar: 1 },
      }
    );

    assert.deepStrictEqual(forms.parse({ ...baseData, headers: { bar: 'foo' } }, 'patch'), {
      id: 'foo',
      headers: { bar: 'foo' },
      data: { foo: 'foo', bar: 1 },
      data2: null,
    });

    assert.deepStrictEqual(
      forms.parse({ ...baseData, remoteAddress: null, num: [321_321_321] }, 'create'),
      {
        id: 'foo',
        remoteAddress: null,
        headers: {},
        data: { foo: 'foo', bar: 1 },
        data2: null,
        num: [321_321_321],
      }
    );

    assert.deepStrictEqual(
      forms.parse({
        ...baseData,
        remote_address: null,
        num: null,
        test: [456, 789],
        created_at: new Date(123_123_123),
      }),
      {
        id: 'foo',
        remoteAddress: null,
        headers: {},
        data: { foo: 'foo', bar: 1 },
        data2: null,
        num: null,
        test: [456, 789],
        createdAt: new Date(123_123_123),
      }
    );
    assert.throws(() => forms.parse({ ...baseData, remote_address: 123 }), TypeError);
    assert.throws(() => forms.parse({ ...baseData, headers: undefined }), TypeError);
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

  it('should only allow string or number key to be an ID key', () => {
    assert.ok(forms.isIdKey('id'));
    assert.ok(!forms.isIdKey('headers'));
  });

  it('should throw error when needed', () => {
    assert.throws(() => forms.parse(null), new TypeError('Data is not an object'));
    assert.throws(
      () => forms.parse({ id: null, data: { foo: 'foo', bar: 1 }, data2: null }, 'create'),
      new TypeError('Key `id` is not nullable but received null')
    );
    assert.throws(
      () =>
        forms.parse(
          {
            id: 'foo',
            headers: {},
            remoteAddress: null,
            num: null,
            data2: 100,
            data: { foo: 'foo', bar: 1 },
            test: [false],
          },
          'create'
        ),
      new TypeError('Unexpected type for key `test`, expected an array of number')
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
      new TypeError(
        'Key `data2` received unexpected undefined. If you are trying to provide an explicit empty value, use null instead.'
      )
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
