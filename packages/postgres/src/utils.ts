import type { Model, NormalizedPrefix, IdKeys, Parser } from '@withtyped/server';
import { ModelRouter } from '@withtyped/server';

import PostgresModelClient from './model-client.js';
import type PostgresQueryClient from './query-client.js';
import type { PostgresJson } from './sql.js';

const getNormalizedPrefix = <T extends string>(table: string): NormalizedPrefix<`/${T}`> => {
  if ([':', '/', ' '].some((value) => table.includes(value))) {
    throw new TypeError(`Table name ${table} includes invalid char (:/ ) for route prefix`);
  }

  // eslint-disable-next-line no-restricted-syntax
  return `/${table}` as NormalizedPrefix<`/${T}`>;
};

export const createModelRouter = <
  Table extends string,
  CreateType extends Record<string, PostgresJson>,
  ModelType extends CreateType,
  ExtendGuard extends Record<string, Parser<unknown>>,
  Q extends PostgresQueryClient
>(
  model: Model<Table, CreateType, ModelType, ExtendGuard>,
  queryClient: Q,
  idKey?: IdKeys<ModelType>
) => {
  const modelClient = new PostgresModelClient(model, queryClient);

  return new ModelRouter(modelClient, getNormalizedPrefix(model.tableName), idKey);
};
