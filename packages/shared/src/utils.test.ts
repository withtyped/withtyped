import assert from 'node:assert';
import { describe, it } from 'node:test';

import { noop } from './utils.js';

describe('utils', () => {
  it('returns nothing from `noop()`', async () => {
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    assert.strictEqual(await noop(), undefined);
  });
});
