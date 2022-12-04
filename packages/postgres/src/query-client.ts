import { QueryClient } from '@withtyped/server';
import type { QueryResult } from '@withtyped/server';
import type { PoolConfig } from 'pg';
import pg from 'pg';

import type { PostgreSql } from './sql.js';

export default class PostgresQueryClient extends QueryClient<PostgreSql> {
  public pool: pg.Pool;
  protected client?: pg.PoolClient;

  constructor(public readonly config?: PoolConfig) {
    super();
    this.pool = new pg.Pool(config);
  }

  async connect() {
    this.client = await this.pool.connect();
  }

  async end() {
    this.client?.release();

    return this.pool.end();
  }

  async query(sql: PostgreSql): Promise<QueryResult<Record<string, unknown>>> {
    if (!this.client) {
      throw new Error('No client found in database pool. Call `.connect()` first.');
    }

    const { raw, args } = sql.composed;

    return this.client.query(raw, args);
  }
}

export const createQueryClient = (...args: ConstructorParameters<typeof PostgresQueryClient>) =>
  new PostgresQueryClient(...args);
