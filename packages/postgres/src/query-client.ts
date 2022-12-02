import { QueryClient } from '@withtyped/server';
import type { QueryResult } from '@withtyped/server';
import type { PoolConfig } from 'pg';
import pg from 'pg';

import type { PostgreSql } from './sql.js';

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

export const createQueryClient = (...args: ConstructorParameters<typeof PostgresQueryClient>) =>
  new PostgresQueryClient(...args);
