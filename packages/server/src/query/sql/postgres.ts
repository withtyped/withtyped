import type { Json } from '../../types.js';
import Sql, { createSqlTag } from './abstract.js';

/** Sql tag class for `pg` (i.e. node-pg) */
export default class PostgreSql extends Sql<Json> {
  get composed(): { raw: string; args: Json[] } {
    const rawArray: string[] = [];

    /* eslint-disable @silverhand/fp/no-mutating-methods */
    for (const [index, value] of this.strings.entries()) {
      rawArray.push(value);

      if (this.args[index] !== undefined) {
        rawArray.push(`$${index + 1}`);
      }
    }
    /* eslint-enable @silverhand/fp/no-mutating-methods */

    return { raw: rawArray.join(''), args: this.args };
  }
}

export const sql = createSqlTag(PostgreSql);
