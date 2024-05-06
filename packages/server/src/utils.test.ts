import assert from 'node:assert';
import { describe, it } from 'node:test';

import { tryThat } from './utils.js';

void describe('tryThat()', () => {
  void it('should run and return the value when everything is ok', () => {
    const symbol = Symbol('test');
    assert.strictEqual(
      tryThat(() => symbol),
      symbol
    );
  });

  void it('should return undefined if the function throws', () => {
    assert.strictEqual(
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      tryThat(() => {
        throw new Error('test');
      }),
      undefined
    );
  });
});
