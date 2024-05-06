import assert from 'node:assert';
import { describe, it } from 'node:test';

import { idSymbolKeys, idSymbols } from '@withtyped/server';
import Model from '@withtyped/server/model';
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
  join,
} from './sql.js';

void describe('IdentifierPostgreSql', () => {
  void it('should compose raw strings only', () => {
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

void describe('JsonPostgreSql', () => {
  void it('should not explode', () => {
    const instance = new JsonPostgreSql(Object.assign([], { raw: [] }), []);
    assert.deepStrictEqual(instance.compose([], []), { lastIndex: 0 });
    assert.throws(() => instance.composed, new Error('Method not implemented.'));
  });
});

void describe('DangerousRawPostgreSql', () => {
  void it('should not explode', () => {
    const instance = new DangerousRawPostgreSql(Object.assign([], { raw: [] }), []);
    assert.deepStrictEqual(instance.compose([], []), { lastIndex: 0 });
    assert.throws(() => instance.composed, new Error('Method not implemented.'));
  });
});

void describe('sql tag', () => {
  void it('should convert query to a safe string with args', () => {
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

void it('should recognize model as identifiers', () => {
  const forms = Model.create(/* Sql */ `
    CREATE table forms (
      id VARCHAR(32) not null,
      data_2 bigint
    );`).identifiable;

  const { raw, args } = sql`
    select * from ${forms}    
    where    ${([[forms.data2, 123]] as const).map(([key, value]) => sql`${key}=${value}`)}
    and  ${forms.id} = ${'foo'}
  `.composed;

  assert.strictEqual(
    normalizeString(raw),
    'select * from "forms" where "forms"."data_2"=$1 and "forms"."id" = $2'
  );
  assert.deepStrictEqual(args, [123, 'foo']);
});

void it('should recognize model as identifiers with schema', () => {
  const foo = Model.create(
    /* Sql */ `create table foo (id varchar(32) primary key not null, bar bigint);`,
    'baz'
  ).identifiable;

  // @ts-expect-error Should be able to access the model's metadata by
  // accessing the global symbol with the same key.
  assert.strictEqual(foo[idSymbols.model], foo[Symbol.for(idSymbolKeys.model)]);

  const { raw, args } = sql`
    update ${foo}    
    set    ${([[foo.bar.update, '123']] as const).map(([key, value]) => sql`${key}=${value}`)}
    where  ${foo.id} = ${'foo'}
  `.composed;

  assert.strictEqual(
    normalizeString(raw),
    'update "baz"."foo" set "bar"=$1 where "baz"."foo"."id" = $2'
  );
  assert.deepStrictEqual(args, ['123', 'foo']);
});

void describe('json utils', () => {
  void it('should be able to compose with the first argument', () => {
    const instance = json({ foo: 'bar' });
    assert.ok(instance instanceof JsonPostgreSql);

    const rawArray: string[] = ['first'];
    const args: PostgresJson[] = [];

    assert.deepStrictEqual(instance.compose(rawArray, args), { lastIndex: 1 });
    assert.deepStrictEqual(rawArray, ['first', '$1::json']);
    assert.deepStrictEqual(args, [JSON.stringify({ foo: 'bar' })]);
  });

  void it('should be able to convert to JSON class when needed', () => {
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

  void it('should be able to compose with the first argument (jsonb)', () => {
    const instance = jsonb({ foo: 'bar' });
    assert.ok(instance instanceof JsonPostgreSql);

    const rawArray: string[] = ['first'];
    const args: PostgresJson[] = [];

    assert.deepStrictEqual(instance.compose(rawArray, args), { lastIndex: 1 });
    assert.deepStrictEqual(rawArray, ['first', '$1::jsonb']);
    assert.deepStrictEqual(args, [JSON.stringify({ foo: 'bar' })]);
  });

  void it('should be able to convert to JSON class when needed (jsonb)', () => {
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

void describe('join', () => {
  void it('should be able to join sql tags', () => {
    const query = sql`
      select *
      from foo
      where ${join([sql`bar = ${'baz'}`, sql`qux = ${'quux'}`], sql` and `)}
    `;
    const { raw, args } = query.composed;
    assert.strictEqual(normalizeString(raw), 'select * from foo where bar = $1 and qux = $2');
    assert.deepStrictEqual(args, ['baz', 'quux']);
  });

  void it('should be able to join an mixed array with sql tags and PostgresJson', () => {
    const query = sql`
      select *
      from foo
      where ${join([sql`${'baz'}`, json({ qux: 'quux' }), { qux: 'quux' }], sql` and `)}
    `;
    const { raw, args } = query.composed;
    assert.strictEqual(normalizeString(raw), 'select * from foo where $1 and $2::json and $3');
    assert.deepStrictEqual(args, ['baz', '{"qux":"quux"}', { qux: 'quux' }]);
  });
});
