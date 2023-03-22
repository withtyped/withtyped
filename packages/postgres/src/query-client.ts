import { Transaction, QueryClient } from '@withtyped/server';
import type { QueryResult } from '@withtyped/server';
import { log } from '@withtyped/shared';
import type { PoolConfig, PoolClient } from 'pg';
import pg from 'pg';

import type { PostgreSql } from './sql.js';

export class PostgresTransaction extends Transaction<PostgreSql> {
  constructor(protected readonly client: PoolClient) {
    super();
  }

  async start(): Promise<void> {
    await this.tryQuery('begin');
  }

  async end(): Promise<void> {
    await this.tryQuery('commit');
    this.client.release();
  }

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: PostgreSql
  ): Promise<QueryResult<T>> {
    const { raw, args } = sql.composed;

    log.debug('query', raw, args);

    return this.tryQuery(raw, args);
  }

  protected async tryQuery<
    Result extends Record<string, unknown> = Record<string, unknown>,
    Args extends unknown[] = unknown[]
  >(text: string, args?: Args) {
    try {
      return await this.client.query<Result, Args>(text, args);
    } catch (error: unknown) {
      await this.client.query('rollback');
      this.client.release();
      throw error;
    }
  }
}

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

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: PostgreSql
  ): Promise<QueryResult<T>> {
    const { raw, args } = sql.composed;
    log.debug('query', raw, args);

    return this.pool.query(raw, args);
  }

  async transaction(): Promise<Transaction<PostgreSql>> {
    const client = await this.pool.connect();

    return new PostgresTransaction(client);
  }
}

export const createQueryClient = (...args: ConstructorParameters<typeof PostgresQueryClient>) =>
  new PostgresQueryClient(...args);
