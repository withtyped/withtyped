import { Transaction, QueryClient } from '@withtyped/server';
import type { QueryResult } from '@withtyped/server';
import { camelCase } from '@withtyped/server/model';
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

export type ClientConfig = {
  transform?: { result: 'camelCase' };
};

export default class PostgresQueryClient extends QueryClient<PostgreSql> {
  #status: 'active' | 'ended' = 'active';
  public pool: pg.Pool;

  constructor(
    /** The config for inner `pg.Pool`. */
    public readonly config?: PoolConfig,
    /** The config for this client. */
    public readonly clientConfig?: ClientConfig
  ) {
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

    const result = await this.pool.query(raw, args);

    if (this.clientConfig?.transform?.result === 'camelCase') {
      return {
        ...result,
        rows: result.rows.map(
          (data) =>
            // eslint-disable-next-line no-restricted-syntax
            Object.fromEntries(
              Object.entries(data).map(([key, value]) => [camelCase(key), value])
            ) as T
        ),
      };
    }

    return result;
  }

  async transaction(): Promise<Transaction<PostgreSql>> {
    const client = await this.pool.connect();

    return new PostgresTransaction(client);
  }
}

export const createQueryClient = (...args: ConstructorParameters<typeof PostgresQueryClient>) =>
  new PostgresQueryClient(...args);
