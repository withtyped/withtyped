import assert from 'node:assert';
import { describe, it } from 'node:test';

import { tryJson } from './utils.js';

describe('tryJson()', () => {
  it('should catch if `.json()` throws', async () => {
    const response = {
      json: async () => {
        throw new Error('not ok');
      },
    };

    // @ts-expect-error for testing
    assert.strictEqual(await tryJson(response), undefined);
  });
});
