import QueryClient from '@withtyped/server/lib/query/client.js';
import type { QueryResult } from '@withtyped/server/lib/query/index.js';
import type PostgreSql from '@withtyped/server/lib/query/sql/postgres.js';
import type { PoolConfig } from 'pg';
import pg from 'pg';

export default class PostgresQueryClient extends QueryClient<PostgreSql> {
  public pool: pg.Pool;

  constructor(config?: PoolConfig) {
    super();
    this.pool = new pg.Pool(config);
  }

  async connect() {
    await this.pool.connect();
  }

  async end() {
    return this.pool.end();
  }

  async query(sql: PostgreSql): Promise<QueryResult<Record<string, unknown>>> {
    const { raw, args } = sql.composed;

    return this.pool.query(raw, args);
  }
}
