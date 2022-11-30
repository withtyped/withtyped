import ModelClient from '@withtyped/server/lib/model-client/index.js';
import type Model from '@withtyped/server/lib/model/index.js';
import type { PostgresJson } from '@withtyped/server/lib/query/sql/postgres.js';
import { sql, identifier, jsonIfNeeded } from '@withtyped/server/lib/query/sql/postgres.js';
import type { PoolConfig } from 'pg';

import PostgresQueryClient from './query.js';

type NonUndefinedValueTuple<Value> = [string, Value extends undefined ? never : Value];

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

    console.log('rows', rows);

    return { rows: rows.map((value) => this.model.parse(value)), rowCount };
  }

  async read(id: string): Promise<ModelType> {
    const { rows } = await this.queryClient.query(sql`
      select (${this.model.keys.map((key) => identifier(key))})
      from ${identifier(this.model.tableName)}
      where id=${id}
    `);

    return this.model.parse(rows[0]);
  }

  async update(id: string, data: Partial<CreateType>): Promise<ModelType> {
    const entries = Object.entries<PostgresJson | undefined>(data).filter(
      (element): element is NonUndefinedValueTuple<PostgresJson> => element[1] !== undefined
    );

    const { rows } = await this.queryClient.query(sql`
      update ${identifier(this.model.tableName)}
      set ${entries.map(([key, value]) => sql`${identifier(key)}=${jsonIfNeeded(value)}`)}
      where id=${id}
      returning ${this.model.keys.map((key) => identifier(key))}
    `);

    console.log(rows);

    return this.model.parse(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.queryClient.query(sql`
      delete from ${identifier(this.model.tableName)}
      where id=${id}
    `);

    return rowCount > 0;
  }
}
