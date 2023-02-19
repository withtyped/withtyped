import type { QueryResult } from './index.js';
import type { Sql } from './utils.js';

export abstract class Queryable<SqlTag extends Sql> {
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
