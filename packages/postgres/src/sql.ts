import type { Json, JsonArray, JsonObject } from '@withtyped/server';
import {
  createDangerousRawSqlFunction,
  createIdentifierSqlFunction,
  createSqlTag,
  Sql,
} from '@withtyped/server';
import { log } from '@withtyped/shared';

/**
 * Copied from https://github.com/brianc/node-postgres/blob/970804b6c110fab500da9db71d68d04e0ecea406/packages/pg/lib/utils.js#L165-L168
 * since `pg` doesn't export this function directly.
 */
// Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
const escapeIdentifier = function (value: string) {
  return '"' + value.replace(/"/g, '""') + '"';
};

export class DangerousRawPostgreSql extends Sql {
  public compose(rawArray: string[], _: unknown[], indexInit = 0) {
    // eslint-disable-next-line @silverhand/fp/no-mutating-methods
    rawArray.push(this.strings[0] ?? '');

    return { lastIndex: indexInit };
  }

  get composed(): { raw: string; args: unknown[] } {
    throw new Error('Method not implemented.');
  }
}

/**
 * Create a raw SQL string without escaping.
 *
 * **CAUTION**: This is dangerous and should only be used for trusted input.
 *
 * @example ```ts
 * sql`${dangerousRaw(`select ${'foo'}`)}` // select foo
 * sql`${dangerousRaw(`select ${'foo'} ${'from bar'}`)}` // select foo from bar
 * // Without `dangerousRaw`, the above would be:
 * sql`select ${'foo'} ${'from bar'}` // select $1 $2
 * ```
 */
export const dangerousRaw = createDangerousRawSqlFunction(DangerousRawPostgreSql);

export class IdentifierPostgreSql extends Sql {
  public compose(rawArray: string[], _: unknown[], indexInit = 0) {
    // eslint-disable-next-line @silverhand/fp/no-mutating-methods
    rawArray.push(this.strings.map((value) => escapeIdentifier(value)).join('.'));

    return { lastIndex: indexInit };
  }

  get composed(): { raw: string; args: unknown[] } {
    throw new Error('Method not implemented.');
  }
}

/**
 * Create a SQL identifier (e.g. table or column name) from one or more strings.
 * Each string will be escaped and joined with a period.
 *
 * @example ```ts
 * sql`identifier('foo')` // "foo"
 * sql`identifier('foo', 'bar')` // "foo"."bar"
 * ```
 */
export const identifier = createIdentifierSqlFunction(IdentifierPostgreSql);
/**
 * Alias for {@link identifier()}.
 *
 * Create a SQL identifier (e.g. table or column name) from one or more strings.
 * Each string will be escaped and joined with a period.
 *
 * @example ```ts
 * sql`identifier('foo')` // "foo"
 * sql`identifier('foo', 'bar')` // "foo"."bar"
 * ```
 */
export const id = identifier;

/**
 * The acceptable JSON types for Postgres, which is a union of {@link Json}
 * and {@link Date}.
 *
 * `Json` is a union of primitive types (string, number, boolean, null) and
 * `JsonArray` and `JsonObject`.
 */
export type PostgresJson = Json | Date;
export type InputArgument =
  | PostgresJson
  | Sql
  | Array<Sql | Exclude<PostgresJson, JsonArray | JsonObject>>;

/** Sql tag class for `pg` (i.e. node-pg) */
export class PostgreSql extends Sql<PostgresJson, InputArgument> {
  public compose(rawArray: string[], args: PostgresJson[], indexInit = 0) {
    /* eslint-disable @silverhand/fp/no-mutating-methods, @silverhand/fp/no-let, @silverhand/fp/no-mutation */
    let globalIndex = indexInit;

    const combineSql = (sql: Sql) => {
      const { lastIndex } = sql.compose(rawArray, args, globalIndex);

      globalIndex = lastIndex;
    };

    const handle = (argument?: InputArgument) => {
      log.debug('handle', argument);

      if (argument === undefined) {
        return;
      }

      if (argument instanceof Sql) {
        combineSql(argument);
      } else if (Array.isArray(argument)) {
        const [first, ...rest] = argument;

        if (first) {
          handle(first);
        }

        for (const sql of rest) {
          rawArray.push(', ');
          handle(sql);
        }
      } else {
        globalIndex += 1;
        rawArray.push(`$${globalIndex}`);
        args.push(argument);
      }
    };

    for (const [index, value] of this.strings.entries()) {
      rawArray.push(value);
      handle(this.args[index]);
    }
    /* eslint-enable @silverhand/fp/no-mutating-methods, @silverhand/fp/no-let, @silverhand/fp/no-mutation */

    return { lastIndex: globalIndex };
  }

  get composed() {
    const rawArray: string[] = [];
    const args: PostgresJson[] = [];

    this.compose(rawArray, args);
    const result = { raw: rawArray.join(''), args };
    log.debug('composed query', result);

    return result;
  }
}

export class JsonPostgreSql extends Sql<string, PostgresJson> {
  constructor(
    strings: TemplateStringsArray,
    args: PostgresJson[],
    public readonly mode: 'json' | 'jsonb' = 'json'
  ) {
    super(strings, args);
  }

  public compose(rawArray: string[], args: PostgresJson[], indexInit = 0) {
    const value = this.args[0];

    if (!value) {
      return { lastIndex: indexInit };
    }

    /* eslint-disable @silverhand/fp/no-mutating-methods */
    rawArray.push(`$${indexInit + 1}::${this.mode}`);
    args.push(JSON.stringify(value));
    /* eslint-enable @silverhand/fp/no-mutating-methods */

    return { lastIndex: indexInit + 1 };
  }

  get composed(): { raw: string; args: string[] } {
    throw new Error('Method not implemented.');
  }
}

/**
 * A tag function for Postgres queries. Which can be used as a template literal.
 * It will automatically escape values and convert them to the parameterized form
 * expected by `pg`.
 *
 * Use {@link identifier()} (or {@link id()}) to escape identifiers (e.g. table or column
 * names).
 *
 * @example ```ts
 * sql`select * from ${id('foo')} where ${id('bar')} = ${'baz'}`
 * // select * from "foo" where "bar" = $1
 * ```
 * Sql tags can be nested:
 *
 * @example ```ts
 * sql`update ${id('foo')} set ${[sql`bar = ${'baz'}`, sql`qux = ${'quux'}`]}`
 * // update "foo" set bar = $1, qux = $2
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates | MDN: Tagged templates}
 */
export const sql = createSqlTag(PostgreSql);

export const json = (data: PostgresJson) =>
  new JsonPostgreSql(Object.assign([], { raw: [] }), [data]);

export const jsonb = (data: PostgresJson) =>
  new JsonPostgreSql(Object.assign([], { raw: [] }), [data], 'jsonb');

export const shouldUseJson = (data: PostgresJson | PostgreSql): data is PostgresJson =>
  Array.isArray(data) ||
  (typeof data === 'object' && data !== null && !(data instanceof Sql || data instanceof Date));

export const jsonIfNeeded = (
  data: PostgresJson | PostgreSql
): PostgreSql | Exclude<PostgresJson, JsonArray | JsonObject> =>
  shouldUseJson(data) ? json(data) : data;

export const jsonbIfNeeded = (
  data: PostgresJson | PostgreSql
): PostgreSql | Exclude<PostgresJson, JsonArray | JsonObject> =>
  shouldUseJson(data) ? jsonb(data) : data;
