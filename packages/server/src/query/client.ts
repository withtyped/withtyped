import type { Nullable } from '@silverhand/essentials';

import { MultipleRowsFoundError, NoResultError } from './errors.js';
import type { QueryResult } from './types.js';
import type { Sql } from './utils.js';

export abstract class Queryable<SqlTag extends Sql> {
  /** Run query and return rows only. */
  async any<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: SqlTag
  ): Promise<T[]> {
    const { rows } = await this.query<T>(sql);

    return rows;
  }

  /**
   * Run query and return rows only.
   *
   * @throws NoResultError if no result found.
   */
  async many<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: SqlTag
  ): Promise<T[]> {
    const { rows } = await this.query<T>(sql);

    if (rows.length === 0) {
      throw new NoResultError(sql);
    }

    return rows;
  }

  /**
   * Run query and return the first row only or `null`.
   *
   * @throws MultipleRowsFoundError if the result has multiple rows.
   */
  async maybeOne<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: SqlTag
  ): Promise<Nullable<T>> {
    const { rows } = await this.query<T>(sql);

    if (rows.length > 1) {
      throw new MultipleRowsFoundError(sql);
    }

    return rows[0] ?? null;
  }

  /**
   * Run query and return the first row only.
   *
   * @throws NoResultError if no result found.
   * @throws MultipleRowsFoundError if the result has multiple rows.
   */
  async one<T extends Record<string, unknown> = Record<string, unknown>>(sql: SqlTag): Promise<T> {
    const { rows } = await this.query<T>(sql);

    if (rows.length > 1) {
      throw new MultipleRowsFoundError(sql);
    }

    if (!rows[0]) {
      throw new NoResultError(sql);
    }

    return rows[0];
  }

  /** Run query and return a boolean value that indicates whether the query produces result. */
  async exists(sql: SqlTag): Promise<boolean> {
    const { rows } = await this.query(sql);

    return rows.length > 0;
  }

  /** Run arbitrary SQL query, return a standard query result. */
  abstract query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: SqlTag
  ): Promise<QueryResult<T>>;
}

export abstract class Transaction<SqlTag extends Sql = Sql> extends Queryable<SqlTag> {
  abstract start(): Promise<void>;
  abstract end(): Promise<void>;
}

export default abstract class QueryClient<SqlTag extends Sql = Sql> extends Queryable<SqlTag> {
  abstract connect<T>(config?: T): Promise<void>;
  abstract end(): Promise<void>;
  abstract transaction(): Promise<Transaction<SqlTag>>;
}
