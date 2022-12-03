import type { QueryResult } from './index.js';
import type { Sql } from './utils.js';

// Abstract class will be an empty class in JS
/* c8 ignore start */
export default abstract class QueryClient<SqlTag extends Sql = Sql> {
  abstract connect<T>(config?: T): Promise<void>;
  abstract query(sql: SqlTag): Promise<QueryResult<Record<string, unknown>>>;
  abstract end(): Promise<void>;
}
/* c8 ignore end */
