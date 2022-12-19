import type { Model, NormalizedPrefix, IdKeys, QueryClient } from '@withtyped/server';
import { ModelRouter } from '@withtyped/server';

import PostgresModelClient from './model-client.js';
import type { PostgresJson, PostgreSql } from './sql.js';

const getNormalizedPrefix = <T extends string>(table: string): NormalizedPrefix<`/${T}`> => {
  if ([':', '/', ' '].some((value) => table.includes(value))) {
    throw new TypeError(`Table name ${table} includes invalid char (:/ ) for route prefix`);
  }

  // eslint-disable-next-line no-restricted-syntax
  return `/${table}` as NormalizedPrefix<`/${T}`>;
};

export const createModelRouter = <
  Table extends string,
  ModelType extends Record<string, PostgresJson | undefined>,
  DefaultKeys extends string,
  ReadonlyKeys extends string,
  Q extends QueryClient<PostgreSql>
>(
  model: Model<Table, ModelType, DefaultKeys, ReadonlyKeys>,
  queryClient: Q,
  idKey?: IdKeys<ModelType>
) => {
  const modelClient = new PostgresModelClient(model, queryClient);

  return new ModelRouter(modelClient, getNormalizedPrefix(model.tableName), idKey);
};
