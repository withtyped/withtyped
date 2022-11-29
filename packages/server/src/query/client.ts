import type { QueryResult } from './index.js';
import type Sql from './sql/abstract.js';

export default abstract class QueryClient<SqlTag extends Sql = Sql> {
  abstract connect<T>(config?: T): Promise<void>;
  abstract query<T>(sql: SqlTag): QueryResult<T>;
  abstract end(): Promise<void>;
}
