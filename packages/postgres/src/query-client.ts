import { QueryClient } from '@withtyped/server';
import type { QueryResult } from '@withtyped/server';
import { log } from '@withtyped/shared';
import type { PoolConfig } from 'pg';
import pg from 'pg';

import type { PostgreSql } from './sql.js';

export default class PostgresQueryClient extends QueryClient<PostgreSql> {
  #status: 'active' | 'ended' = 'active';
  public pool: pg.Pool;

  constructor(public readonly config?: PoolConfig) {
    super();
    this.pool = new pg.Pool(config);
  }

  get status() {
    return this.#status;
  }

  async connect() {
    const client = await this.pool.connect();
    client.release();
  }

  async end() {
    if (this.#status === 'ended') {
      return;
    }
    await this.pool.end();
    this.#status = 'ended';
  }

  async query<T extends Record<string, unknown>>(sql: PostgreSql): Promise<QueryResult<T>>;
  async query(sql: PostgreSql): Promise<QueryResult<Record<string, unknown>>>;
  async query(sql: PostgreSql): Promise<QueryResult<Record<string, unknown>>> {
    const { raw, args } = sql.composed;
    log.debug('query', raw, args);

    return this.pool.query(raw, args);
  }
}

export const createQueryClient = (...args: ConstructorParameters<typeof PostgresQueryClient>) =>
  new PostgresQueryClient(...args);
