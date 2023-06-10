import type { QueryClient } from '@withtyped/server';
import { ModelClientError, ModelClient } from '@withtyped/server';
import type Model from '@withtyped/server/model';

import type { PostgresJson, PostgreSql } from './sql.js';
import { identifier, jsonIfNeeded, sql } from './sql.js';

type NonUndefinedValueTuple<Value> = [string, Value extends undefined ? never : Value];

type ValidKey = string;
export default class PostgresModelClient<
  Table extends string,
  ModelType extends Record<string, PostgresJson | undefined>,
  DefaultKeys extends string = never,
  ReadonlyKeys extends string = never
> extends ModelClient<Table, ModelType, DefaultKeys, ReadonlyKeys> {
  protected rawKeys: string[];

  constructor(
    public readonly model: Model<Table, ModelType, DefaultKeys, ReadonlyKeys>,
    public readonly queryClient: QueryClient<PostgreSql>
  ) {
    super();
    this.rawKeys = Object.values(this.model.rawConfigs).map(({ rawKey }) => rawKey);
  }

  async connect() {
    return this.queryClient.connect();
  }

  async end() {
    return this.queryClient.end();
  }

  async create(data: Record<string, PostgresJson | undefined>): Promise<ModelType> {
    const entries = this.convertToEntries(data);

    const { rows } = await this.queryClient.query(sql`
      insert into ${identifier(this.model.tableName)}
        (${entries.map(([key]) => identifier(key))})
      values (${entries.map(([, value]) => jsonIfNeeded(value))})
      returning ${this.rawKeys.map((key) => identifier(key))}
    `);

    return this.model.parse(rows[0]);
  }

  async readAll(): Promise<{ rows: ModelType[]; rowCount: number }> {
    const { rows, rowCount } = await this.queryClient.query(sql`
      select ${this.rawKeys.map((key) => identifier(key))}
      from ${identifier(this.model.tableName)}
    `);

    return { rows: rows.map((value) => this.model.parse(value)), rowCount };
  }

  async read(whereKey: ValidKey, value: string): Promise<ModelType> {
    const { rows } = await this.queryClient.query(sql`
      select ${this.rawKeys.map((key) => identifier(key))}
      from ${identifier(this.model.tableName)}
      ${this.whereClause(whereKey, value)}
    `);

    if (!rows[0]) {
      throw new ModelClientError('entity_not_found');
    }

    // TODO: Consider remove this since the response has guarded in route?
    return this.model.parse(rows[0]);
  }

  async update(
    whereKey: ValidKey,
    value: string,
    data: Record<string, PostgresJson | undefined>
  ): Promise<ModelType> {
    const entries = this.convertToEntries(data);

    const { rows } = await this.queryClient.query(sql`
      update ${identifier(this.model.tableName)}
      set ${entries.map(([key, value]) => sql`${identifier(key)}=${jsonIfNeeded(value)}`)}
      ${this.whereClause(whereKey, value)}
      returning ${this.rawKeys.map((key) => identifier(key))}
    `);

    if (!rows[0]) {
      throw new ModelClientError('entity_not_found');
    }

    return this.model.parse(rows[0]);
  }

  async delete(whereKey: ValidKey, value: string): Promise<boolean> {
    const { rowCount } = await this.queryClient.query(sql`
      delete from ${identifier(this.model.tableName)}
      ${this.whereClause(whereKey, value)}
    `);

    return rowCount > 0;
  }

  protected whereClause(whereKey: ValidKey, value: string): PostgreSql {
    const config = this.model.rawConfigs[whereKey];

    if (!config) {
      throw new ModelClientError('key_not_found');
    }

    if (!['string', 'number'].includes(config.type)) {
      throw new TypeError('Key in where clause must map to a string or number value');
    }

    return sql`where ${identifier(config.rawKey)}=${
      config.type === 'number' ? Number(value) : value
    }`;
  }

  protected convertToEntries(data: Record<string, PostgresJson | undefined>) {
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
  ModelType extends Record<string, PostgresJson | undefined> = {},
  DefaultKeys extends string = never,
  ReadonlyKeys extends string = never
>(
  ...args: ConstructorParameters<
    typeof PostgresModelClient<Table, ModelType, DefaultKeys, ReadonlyKeys>
  >
) => new PostgresModelClient<Table, ModelType, DefaultKeys, ReadonlyKeys>(...args);
