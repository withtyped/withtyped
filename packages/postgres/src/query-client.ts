import { Transaction, QueryClient } from '@withtyped/server';
import type { QueryResult } from '@withtyped/server';
import { camelCase } from '@withtyped/server/model';
import { log } from '@withtyped/shared';
import type { PoolConfig, PoolClient } from 'pg';
import pg from 'pg';

import type { PostgreSql } from './sql.js';

class ResultTransformer {
  constructor(protected readonly clientConfig?: ClientConfig) {}

  transform<T extends Record<string, unknown> = Record<string, unknown>>(
    data: QueryResult<T>
  ): QueryResult<T> {
    if (this.clientConfig?.transform?.result === 'camelCase') {
      return {
        ...data,
        // It could be `undefined` if it is not a `SELECT` query.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        rows: data.rows?.map(
          (data: Record<string, unknown>) =>
            // eslint-disable-next-line no-restricted-syntax
            Object.fromEntries(
              Object.entries(data).map(([key, value]) => [camelCase(key), value])
            ) as T
        ),
      };
    }

    return data;
  }
}

export class PostgresTransaction extends Transaction<PostgreSql> {
  #transformer: ResultTransformer;

  constructor(
    protected readonly client: PoolClient,
    protected readonly clientConfig?: ClientConfig
  ) {
    super();
    this.#transformer = new ResultTransformer(clientConfig);
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
    Args extends unknown[] = unknown[],
  >(text: string, args?: Args) {
    try {
      const result = await this.client.query<Result, Args>(text, args);
      return this.#transformer.transform(result);
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
  public pool: pg.Pool;

  #status: 'active' | 'ended' = 'active';
  #transformer: ResultTransformer;

  constructor(
    /** The config for inner `pg.Pool`. */
    public readonly config?: PoolConfig,
    /** The config for this client. */
    public readonly clientConfig?: ClientConfig
  ) {
    super();
    this.pool = new pg.Pool(config);
    this.#transformer = new ResultTransformer(clientConfig);
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
    return this.#transformer.transform(result);
  }

  async transaction(): Promise<Transaction<PostgreSql>> {
    const client = await this.pool.connect();

    return new PostgresTransaction(client, this.clientConfig);
  }
}

export const createQueryClient = (...args: ConstructorParameters<typeof PostgresQueryClient>) =>
  new PostgresQueryClient(...args);
