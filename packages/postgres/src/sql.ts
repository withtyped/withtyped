import type { Json, JsonArray, JsonObject } from '@withtyped/server';
import { createIdentifierSqlFunction, createSqlTag, Sql } from '@withtyped/server';
import { log } from '@withtyped/shared';

export class IdentifierPostgreSql extends Sql {
  public compose(rawArray: string[], _: unknown[], indexInit = 0) {
    // eslint-disable-next-line @silverhand/fp/no-mutating-methods
    rawArray.push(this.strings.map((value) => `"${value}"`).join('.'));

    return { lastIndex: indexInit };
  }

  get composed(): { raw: string; args: unknown[] } {
    throw new Error('Method not implemented.');
  }
}

export const identifier = createIdentifierSqlFunction(IdentifierPostgreSql);
export const id = identifier;

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
  public compose(rawArray: string[], args: PostgresJson[], indexInit = 0) {
    const value = this.args[0];

    if (!value) {
      return { lastIndex: indexInit };
    }

    /* eslint-disable @silverhand/fp/no-mutating-methods */
    rawArray.push(`$${indexInit + 1}::json`);
    args.push(JSON.stringify(value));
    /* eslint-enable @silverhand/fp/no-mutating-methods */

    return { lastIndex: indexInit + 1 };
  }

  get composed(): { raw: string; args: string[] } {
    throw new Error('Method not implemented.');
  }
}

export const sql = createSqlTag(PostgreSql);

export const json = (data: PostgresJson) =>
  new JsonPostgreSql(Object.assign([], { raw: [] }), [data]);

export const jsonIfNeeded = (
  data: PostgresJson | PostgreSql
): PostgreSql | Exclude<PostgresJson, JsonArray | JsonObject> =>
  Array.isArray(data) ||
  (typeof data === 'object' && data !== null && !(data instanceof Sql || data instanceof Date))
    ? json(data)
    : data;
