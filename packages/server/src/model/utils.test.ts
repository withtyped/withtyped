import assert from 'node:assert';
import { describe, it } from 'node:test';

import { camelCase, findType, parsePrimitiveType, parseRawConfigs } from './utils.js';

const typeLiterals = Object.freeze({
  number: 'number',
  date: 'date',
  string: 'string',
  boolean: 'boolean',
  json: 'json',
});

describe('findType()', () => {
  it('should return proper type when matches', () => {
    assert.strictEqual(findType('int64'), typeLiterals.number);
    assert.strictEqual(findType('serial'), typeLiterals.number);
    assert.strictEqual(findType('numeric'), typeLiterals.number);
    assert.strictEqual(findType('timestamptz'), typeLiterals.date);
    assert.strictEqual(findType('bool'), typeLiterals.boolean);
    assert.strictEqual(findType('varchar(128)'), typeLiterals.string);
    assert.strictEqual(findType('text'), typeLiterals.string);
    assert.strictEqual(findType('jsonb'), typeLiterals.json);
  });

  it('should return undefined when no match', () => {
    assert.strictEqual(findType('number'), undefined);
    assert.strictEqual(findType(), undefined);
    assert.strictEqual(findType(''), undefined);
  });
});

describe('parseRawConfigs()', () => {
  it('should parse as expected', () => {
    assert.deepStrictEqual(
      parseRawConfigs(`
      create table if not exists tests
    `),
      {}
    );

    assert.deepStrictEqual(
      parseRawConfigs(`
      create table if not exists tests (
        something_to_ignore,
        name varchar(256) not null,
        test_1 jsonb,
        test_2_test boolean array,
        created_at timestamptz not null default(now()),
        constraint int all constraints should be ignored,
        like bool all likes should be ignored
      );
  `),
      {
        name: {
          type: typeLiterals.string,
          rawKey: 'name',
          isArray: false,
          isNullable: false,
          hasDefault: false,
        },
        test1: {
          type: typeLiterals.json,
          rawKey: 'test_1',
          isArray: false,
          isNullable: true,
          hasDefault: false,
        },
        test2Test: {
          type: typeLiterals.boolean,
          rawKey: 'test_2_test',
          isArray: true,
          isNullable: true,
          hasDefault: false,
        },
        createdAt: {
          type: typeLiterals.date,
          rawKey: 'created_at',
          isArray: false,
          isNullable: false,
          hasDefault: true,
        },
      }
    );
  });
});

describe('parsePrimitiveType()', () => {
  it('should parse correctly', () => {
    assert.strictEqual(parsePrimitiveType(false, 'boolean'), false);
    assert.strictEqual(parsePrimitiveType(12_345, 'number'), 12_345);
    assert.strictEqual(parsePrimitiveType('12345', 'number'), 12_345);
    assert.strictEqual(parsePrimitiveType('12345', 'string'), '12345');
    assert.deepStrictEqual(parsePrimitiveType({ foo: 'bar' }, 'json'), { foo: 'bar' });
    assert.deepStrictEqual(parsePrimitiveType(['foo', 'bar', true], 'json'), ['foo', 'bar', true]);
    assert.deepStrictEqual(parsePrimitiveType(new Date(12_345), 'date'), new Date(12_345));
  });

  it('should return undefined when parse failed', () => {
    assert.strictEqual(parsePrimitiveType('false', 'boolean'), undefined);
    assert.strictEqual(parsePrimitiveType('not_a_number', 'number'), undefined);
    assert.strictEqual(parsePrimitiveType(Number.NaN, 'number'), undefined);
    assert.strictEqual(parsePrimitiveType({}, 'string'), undefined);
    assert.strictEqual(parsePrimitiveType('json', 'json'), undefined);
    assert.strictEqual(parsePrimitiveType('12345', 'date'), undefined);
    // @ts-expect-error for testing
    assert.throws(() => parsePrimitiveType('false', 'expect-error'), TypeError);
  });
});

describe('camelCase()', () => {
  it('should parse properly', () => {
    assert.strictEqual(camelCase(''), '');
    assert.strictEqual(camelCase('____foo_bar-baz'), 'fooBarBaz');
    assert.strictEqual(camelCase('---even_number_1_is_ok___'), 'evenNumber1IsOk');
    assert.strictEqual(camelCase('number1_is_ok'), 'number1IsOk');
  });
});
