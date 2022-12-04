import type { Model } from '@withtyped/server';
import { ModelClientError, ModelClient } from '@withtyped/server';

import type PostgresQueryClient from './query-client.js';
import type { PostgresJson } from './sql.js';
import { identifier, jsonIfNeeded, sql } from './sql.js';

type NonUndefinedValueTuple<Value> = [string, Value extends undefined ? never : Value];

type ValidKey = string | number | symbol;

export default class PostgresModelClient<
  Table extends string,
  CreateType extends Record<string, PostgresJson | undefined>,
  ModelType extends CreateType
> extends ModelClient<Table, CreateType, ModelType> {
  constructor(
    public readonly model: Model<Table, CreateType, ModelType>,
    public readonly queryClient: PostgresQueryClient
  ) {
    super();
  }

  async connect() {
    return this.queryClient.connect();
  }

  async end() {
    return this.queryClient.end();
  }

  async create(data: CreateType): Promise<ModelType> {
    const entries = this.convertToEntries(data);

    const { rows } = await this.queryClient.query(sql`
      insert into ${identifier(this.model.tableName)}
        (${entries.map(([key]) => identifier(key))})
      values (${entries.map(([, value]) => jsonIfNeeded(value))})
      returning ${this.model.rawKeys.map((key) => identifier(key))}
    `);

    return this.model.parse(rows[0]);
  }

  async readAll(): Promise<{ rows: ModelType[]; rowCount: number }> {
    const { rows, rowCount } = await this.queryClient.query(sql`
      select ${this.model.rawKeys.map((key) => identifier(key))}
      from ${identifier(this.model.tableName)}
    `);

    return { rows: rows.map((value) => this.model.parse(value)), rowCount };
  }

  async read(whereKey: ValidKey, value: string): Promise<ModelType> {
    const { rows } = await this.queryClient.query(sql`
      select (${this.model.rawKeys.map((key) => identifier(key))})
      from ${identifier(this.model.tableName)}
      where ${identifier(String(whereKey))}=${value}
    `);

    if (!rows[0]) {
      throw new ModelClientError('entity_not_found');
    }

    return this.model.parse(rows[0]);
  }

  async update(whereKey: ValidKey, value: string, data: Partial<CreateType>): Promise<ModelType> {
    const entries = this.convertToEntries(data);

    const { rows } = await this.queryClient.query(sql`
      update ${identifier(this.model.tableName)}
      set ${entries.map(([key, value]) => sql`${identifier(key)}=${jsonIfNeeded(value)}`)}
      where ${identifier(String(whereKey))}=${value}
      returning ${this.model.rawKeys.map((key) => identifier(key))}
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

  protected convertToEntries(data: Partial<CreateType>) {
    return Object.entries<PostgresJson | undefined>(data)
      .filter(
        (element): element is NonUndefinedValueTuple<PostgresJson> => element[1] !== undefined
      )
      .map<NonUndefinedValueTuple<PostgresJson>>(([key, value]) => [
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.model.rawConfigs[key]!.rawKey,
        value,
      ]);
  }
}

export const createModelClient = <
  Table extends string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  CreateType extends Record<string, PostgresJson | undefined> = {},
  ModelType extends CreateType = CreateType
>(
  ...args: ConstructorParameters<typeof PostgresModelClient<Table, CreateType, ModelType>>
) => new PostgresModelClient<Table, CreateType, ModelType>(...args);
