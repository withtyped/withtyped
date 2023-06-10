import assert from 'node:assert';
import { describe, it } from 'node:test';

import { createIdentifierSqlFunction, createSqlTag, Sql } from './index.js';

class TestSql extends Sql {
  compose() {
    return { lastIndex: 1 };
  }

  get composed() {
    return { raw: this.strings.join('.'), args: this.args };
  }
}

describe('Sql', () => {
  it('should be a base class with properties', () => {
    const strings = Object.assign(['a', 'b', 'c'], { raw: ['a', 'b', 'c'] });
    const args = ['foo', 'bar', 123];
    // @ts-expect-error for testing
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    assert.deepStrictEqual(Object.entries(new Sql(strings, args)), [
      ['strings', strings],
      ['args', args],
    ]);
  });
});

describe('createIdentifierSqlFunction()', () => {
  it('should call the constructor function correctly', () => {
    const instance = createIdentifierSqlFunction(TestSql)('a', 'b', 'c');

    assert.deepStrictEqual(
      instance.strings,
      Object.assign(['a', 'b', 'c'], { raw: ['a', 'b', 'c'] })
    );
    assert.deepStrictEqual(instance.args, []);
  });
});

describe('createSqlTag()', () => {
  it('should call the constructor function correctly', () => {
    const sql = createSqlTag(TestSql);
    const instance = sql`select ${'foo'} from bar`;

    assert.deepStrictEqual(instance.strings, ['select ', ' from bar']);
    assert.deepStrictEqual(instance.args, ['foo']);
  });
});
