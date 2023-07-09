import assert from 'node:assert';
import { describe, it } from 'node:test';

import { normalizeString } from '@withtyped/shared';

import type { PostgresJson } from './sql.js';
import {
  jsonb,
  jsonbIfNeeded,
  DangerousRawPostgreSql,
  dangerousRaw,
  IdentifierPostgreSql,
  jsonIfNeeded,
  id,
  json,
  JsonPostgreSql,
  sql,
} from './sql.js';

describe('IdentifierPostgreSql', () => {
  it('should compose raw strings only', () => {
    const instance = new IdentifierPostgreSql(
      Object.assign(['foo', 'bar'], { raw: ['foo', 'bar'] }),
      ['baz']
    );
    const rawArray: string[] = [];
    const args: unknown[] = [];
    assert.deepStrictEqual(instance.compose(rawArray, args), { lastIndex: 0 });
    assert.deepStrictEqual(rawArray, ['"foo"."bar"']);
    assert.deepStrictEqual(args, []);

    assert.throws(() => instance.composed, new Error('Method not implemented.'));
  });
});

describe('JsonPostgreSql', () => {
  it('should not explode', () => {
    const instance = new JsonPostgreSql(Object.assign([], { raw: [] }), []);
    assert.deepStrictEqual(instance.compose([], []), { lastIndex: 0 });
    assert.throws(() => instance.composed, new Error('Method not implemented.'));
  });
});

describe('DangerousRawPostgreSql', () => {
  it('should not explode', () => {
    const instance = new DangerousRawPostgreSql(Object.assign([], { raw: [] }), []);
    assert.deepStrictEqual(instance.compose([], []), { lastIndex: 0 });
    assert.throws(() => instance.composed, new Error('Method not implemented.'));
  });
});

describe('sql tag', () => {
  it('should convert query to a safe string with args', () => {
    const { raw, args } = sql`
      update ${id('foo')}    
      set    ${(
        [
          [id('public', 'col1'), 123],
          [id('"ok"', 'col2'), true],
          [id('col3'), null],
          [id('col4'), { foo: 'bar' }],
        ] as const
      ).map(([key, value]) => sql`${key}=${value}`)}    ${dangerousRaw('and "something";')}
    `.composed;

    assert.strictEqual(
      normalizeString(raw),
      'update "foo" set "public"."col1"=$1, """ok"""."col2"=$2, "col3"=$3, "col4"=$4 and "something";'
    );
    assert.deepStrictEqual(args, [123, true, null, { foo: 'bar' }]);
  });
});

describe('json utils', () => {
  it('should be able to compose with the first argument', () => {
    const instance = json({ foo: 'bar' });
    assert.ok(instance instanceof JsonPostgreSql);

    const rawArray: string[] = ['first'];
    const args: PostgresJson[] = [];

    assert.deepStrictEqual(instance.compose(rawArray, args), { lastIndex: 1 });
    assert.deepStrictEqual(rawArray, ['first', '$1::json']);
    assert.deepStrictEqual(args, [JSON.stringify({ foo: 'bar' })]);
  });

  it('should be able to convert to JSON class when needed', () => {
    assert.ok(jsonIfNeeded(null) === null);
    assert.ok(jsonIfNeeded('foo') === 'foo');

    const json1 = jsonIfNeeded([null]);
    assert.ok(json1 instanceof JsonPostgreSql);
    assert.deepStrictEqual(json1.args, [[null]]);

    const json2 = jsonIfNeeded({ foo: 'bar' });
    assert.ok(json2 instanceof JsonPostgreSql);
    assert.deepStrictEqual(json2.args, [{ foo: 'bar' }]);

    const json3 = sql`select * from somewhere;`;
    assert.strictEqual(jsonIfNeeded(json3), json3);
  });

  it('should be able to compose with the first argument (jsonb)', () => {
    const instance = jsonb({ foo: 'bar' });
    assert.ok(instance instanceof JsonPostgreSql);

    const rawArray: string[] = ['first'];
    const args: PostgresJson[] = [];

    assert.deepStrictEqual(instance.compose(rawArray, args), { lastIndex: 1 });
    assert.deepStrictEqual(rawArray, ['first', '$1::jsonb']);
    assert.deepStrictEqual(args, [JSON.stringify({ foo: 'bar' })]);
  });

  it('should be able to convert to JSON class when needed (jsonb)', () => {
    assert.ok(jsonbIfNeeded(null) === null);
    assert.ok(jsonbIfNeeded('foo') === 'foo');

    const json1 = jsonbIfNeeded([null]);
    assert.ok(json1 instanceof JsonPostgreSql);
    assert.deepStrictEqual(json1.args, [[null]]);

    const json2 = jsonbIfNeeded({ foo: 'bar' });
    assert.ok(json2 instanceof JsonPostgreSql);
    assert.deepStrictEqual(json2.args, [{ foo: 'bar' }]);

    const json3 = sql`select * from somewhere;`;
    assert.strictEqual(jsonbIfNeeded(json3), json3);
  });
});
