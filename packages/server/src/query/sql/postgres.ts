import type { Json } from '../../types.js';
import Sql, { createIdentifierSqlFunction, createSqlTag, IdentifierSql } from './abstract.js';

export class IdentifierPostgreSql extends IdentifierSql {
  get composed() {
    return { raw: this.strings.map((value) => `"${value}"`).join('.'), args: [] };
  }
}

export const identifier = createIdentifierSqlFunction(IdentifierPostgreSql);
export const id = identifier;

const isSqlArray = (array: unknown): array is Array<PostgreSql | IdentifierSql> =>
  Array.isArray(array) &&
  array.every((value) => value instanceof PostgreSql || value instanceof IdentifierSql);

type InputArg = Json | PostgreSql | IdentifierSql | Array<PostgreSql | IdentifierSql>;

/** Sql tag class for `pg` (i.e. node-pg) */
export default class PostgreSql extends Sql<Json, InputArg> {
  protected compose(rawArray: string[], args: Json[], indexInit = 0) {
    /* eslint-disable @silverhand/fp/no-mutating-methods, @silverhand/fp/no-let, @silverhand/fp/no-mutation */
    let globalIndex = indexInit;

    const combineSql = (sql: PostgreSql | IdentifierSql) => {
      if (sql instanceof IdentifierSql) {
        rawArray.push(sql.composed.raw);

        return;
      }

      const { lastIndex } = sql.compose(rawArray, args, globalIndex);

      globalIndex = lastIndex;
    };

    const handle = (arg?: InputArg) => {
      if (arg === undefined) {
        return;
      }

      if (arg instanceof PostgreSql || arg instanceof IdentifierSql) {
        combineSql(arg);
      } else if (isSqlArray(arg)) {
        const [first, ...rest] = arg;

        if (first) {
          combineSql(first);
        }

        for (const sql of rest) {
          rawArray.push(', ');
          combineSql(sql);
        }
      } else {
        globalIndex += 1;
        rawArray.push(`$${globalIndex}`);
        args.push(arg);
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
    const args: Json[] = [];

    this.compose(rawArray, args);

    return { raw: rawArray.join(''), args };
  }
}

export const sql = createSqlTag(PostgreSql);
