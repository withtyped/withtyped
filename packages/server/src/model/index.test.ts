import assert from 'node:assert';

import { describe, it } from 'node:test';
import { z } from 'zod';

import Model from './index.js';

describe('Model class', () => {
  it('should construct proper class', () => {
    const forms = Model.create(
      /* Sql */ `
      CREATE table forms ( 
        id VARCHAR(32) not null,
        remote_address varchar(128),
        headers jsonb not null,
        data jsonb,
        num bigint array,
        test decimal not null array default([]),
        created_at timestamptz not null default(now())
      );
    `
    ).extend('data', z.object({ foo: z.string(), bar: z.number() }));
    const baseData = {
      id: 'foo',
      headers: {},
      data: { foo: 'foo', bar: 1 },
      test: [456, 789],
      created_at: 123,
    };

    assert.deepStrictEqual(forms.parse(baseData), {
      id: 'foo',
      remoteAddress: null,
      headers: {},
      data: { foo: 'foo', bar: 1 },
      num: null,
      test: [456, 789],
      createdAt: 123,
    });
    assert.throws(() => forms.parse({ ...baseData, remote_address: 123 }), TypeError);
    assert.throws(() => forms.parse({ ...baseData, headers: undefined }), TypeError);
  });
});
