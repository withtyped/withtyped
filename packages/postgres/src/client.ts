import type { Model } from '@withtyped/server';
import { ModelClientError, ModelClient } from '@withtyped/server';
import type { PoolConfig } from 'pg';

import PostgresQueryClient from './query.js';
import type { PostgresJson } from './sql.js';
import { identifier, jsonIfNeeded, sql } from './sql.js';

type NonUndefinedValueTuple<Value> = [string, Value extends undefined ? never : Value];

type ValidKey = string | number | symbol;

export default class PostgresModelClient<
  Table extends string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  CreateType extends Record<string, PostgresJson> = {},
  ModelType extends CreateType = CreateType
> extends ModelClient<Table, CreateType, ModelType> {
  protected queryClient: PostgresQueryClient;

  constructor(readonly model: Model<Table, CreateType, ModelType>, config?: PoolConfig) {
    super();
    this.queryClient = new PostgresQueryClient(config);
  }

  async connect() {
    return this.queryClient.connect();
  }

  async end() {
    return this.queryClient.end();
  }

  async create(data: CreateType): Promise<ModelType> {
    const entries = Object.entries<PostgresJson | undefined>(data).filter(
      (element): element is NonUndefinedValueTuple<PostgresJson> => element[1] !== undefined
    );

    const { rows } = await this.queryClient.query(sql`
      insert into ${identifier(this.model.tableName)}
        (${entries.map(([key]) => identifier(key))})
      values (${entries.map(([, value]) => jsonIfNeeded(value))})
      returning ${this.model.keys.map((key) => identifier(key))}
    `);

    return this.model.parse(rows[0]);
  }

  async readAll(): Promise<{ rows: ModelType[]; rowCount: number }> {
    const { rows, rowCount } = await this.queryClient.query(sql`
      select ${this.model.keys.map((key) => identifier(key))}
      from ${identifier(this.model.tableName)}
    `);

    return { rows: rows.map((value) => this.model.parse(value)), rowCount };
  }

  async read(whereKey: ValidKey, value: string): Promise<ModelType> {
    const { rows } = await this.queryClient.query(sql`
      select (${this.model.keys.map((key) => identifier(key))})
      from ${identifier(this.model.tableName)}
      where ${identifier(String(whereKey))}=${value}
    `);

    if (!rows[0]) {
      throw new ModelClientError('entity_not_found');
    }

    return this.model.parse(rows[0]);
  }

  async update(whereKey: ValidKey, value: string, data: Partial<CreateType>): Promise<ModelType> {
    const entries = Object.entries<PostgresJson | undefined>(data).filter(
      (element): element is NonUndefinedValueTuple<PostgresJson> => element[1] !== undefined
    );

    const { rows } = await this.queryClient.query(sql`
      update ${identifier(this.model.tableName)}
      set ${entries.map(([key, value]) => sql`${identifier(key)}=${jsonIfNeeded(value)}`)}
      where ${identifier(String(whereKey))}=${value}
      returning ${this.model.keys.map((key) => identifier(key))}
    `);

    if (!rows[0]) {
      throw new ModelClientError('entity_not_found');
    }

    return this.model.parse(rows[0]);
  }

  async delete(whereKey: ValidKey, value: string): Promise<boolean> {
    const { rowCount } = await this.queryClient.query(sql`
      delete from ${identifier(this.model.tableName)}
      where ${identifier(String(whereKey))}=${value}
    `);

    return rowCount > 0;
  }
}
