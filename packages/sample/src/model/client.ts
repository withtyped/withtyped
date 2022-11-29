import ModelClient from '@withtyped/server/lib/model-client/index.js';
import type Model from '@withtyped/server/lib/model/index.js';
import { sql } from '@withtyped/server/lib/query/sql/postgres.js';
import type { Json } from '@withtyped/server/lib/types.js';

import PostgresQueryClient from './query.js';

type NonUndefinedValueTuple<Value> = [string, Value extends undefined ? never : Value];

export default class PostgresModelClient<
  Table extends string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  CreateType extends Record<string, Json> = {},
  ModelType extends CreateType = CreateType
> extends ModelClient<Table, CreateType, ModelType> {
  protected queryClient = new PostgresQueryClient();

  constructor(readonly model: Model<Table, CreateType, ModelType>) {
    super();
  }

  async create(data: CreateType): Promise<ModelType> {
    const { rows } = await this.queryClient.query(sql`
      insert into ${this.model.tableName} (${Object.keys(data)})
      values (${Object.values(data)})
      returning ${this.model.keys}
    `);

    return this.model.parse(rows[0]);
  }

  async readAll(): Promise<{ rows: ModelType[]; rowCount: number }> {
    const { rows, rowCount } = await this.queryClient.query(sql`
      select (${this.model.keys}) from ${this.model.tableName}
    `);

    return { rows: rows.map((value) => this.model.parse(value)), rowCount };
  }

  async read(id: string): Promise<ModelType> {
    const { rows } = await this.queryClient.query(sql`
      select (${this.model.keys}) from ${this.model.tableName}
      where id=${id}
    `);

    return this.model.parse(rows[0]);
  }

  async update(id: string, data: Partial<CreateType>): Promise<ModelType> {
    const entries = Object.entries<Json | undefined>(data).filter(
      (element): element is NonUndefinedValueTuple<Json> => element[1] !== undefined
    );

    const { rows } = await this.queryClient.query(sql`
      update ${this.model.tableName}
      set ${entries.map(([key, value]) => sql`${key}=${value}`)}
      where id=${id}
      returning ${this.model.keys}
    `);

    return this.model.parse(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.queryClient.query(sql`
      delete from ${this.model.tableName}
      where id=${id}
    `);

    return rowCount > 0;
  }
}
