import assert from 'node:assert';
import { describe, it } from 'node:test';

import { normalizeString } from '@withtyped/shared';

import { id, sql } from './sql.js';

describe('postgres sql tag', () => {
  it('should convert query to a safe string with args', () => {
    const { raw, args } = sql`
      update ${id('foo')}    
      set    ${(
        [
          [id('col1'), 123],
          [id('col2'), true],
          [id('col3'), null],
          [id('col4'), { foo: 'bar' }],
        ] as const
      ).map(([key, value]) => sql`${key}=${value}`)}
    `.composed;

    assert.strictEqual(
      normalizeString(raw),
      'update "foo" set "col1"=$1, "col2"=$2, "col3"=$3, "col4"=$4'
    );
    assert.deepStrictEqual(args, [123, true, null, { foo: 'bar' }]);
  });
});
