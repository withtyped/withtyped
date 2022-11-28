import { describe, it } from 'node:test';
import { z } from 'zod';

import type { Infer } from './index.js';
import Model from './index.js';

describe('Model class', () => {
  it('should construct proper class', () => {
    const forms = Model.create(
      /* Sql */ `
      CREATE table forms ( 
        id VARCHAR(32) not null,
        remote_address varchar(128),
        headers jsonb,
        data jsonb,
        num bigint array,
        test decimal not null array default([]),
        created_at timestamptz not null default(now())
      );
    `
    ).extend('data', z.object({ foo: z.string(), bar: z.number() }));

    type Form = Infer<typeof forms>;
  });
});
