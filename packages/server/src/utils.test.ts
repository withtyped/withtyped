import assert from 'node:assert';

import { describe, it } from 'node:test';

import { createParser, tryThat } from './utils.js';

describe('tryThat()', () => {
  it('should run and return the value when everything is ok', () => {
    const symbol = Symbol('test');
    assert.strictEqual(
      tryThat(() => symbol),
      symbol
    );
  });

  it('should return undefined if the function throws', () => {
    assert.strictEqual(
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      tryThat(() => {
        throw new Error('test');
      }),
      undefined
    );
  });
});

describe('createParser()', () => {
  it('creates parser with the correct structure', async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const parse = () => true;
    assert.deepStrictEqual(createParser(parse), { parse });
  });
});
