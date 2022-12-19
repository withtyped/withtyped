import type Model from '../model/index.js';

/**
 * A client for CRUD a specific model to a storage.
 *
 * We don't care the data type here since it may has a huge difference between database schema and model.
 * Implement until we need it.
 **/
export default abstract class ModelClient<
  /* eslint-disable @typescript-eslint/ban-types */
  Table extends string,
  ModelType extends Record<string, unknown> = {},
  DefaultKeys extends string = never,
  ReadonlyKeys extends string = never
  /* eslint-enable @typescript-eslint/ban-types */
> {
  abstract readonly model: Model<Table, ModelType, DefaultKeys, ReadonlyKeys>;

  abstract create(data: Record<string, unknown>): Promise<ModelType>;

  abstract readAll(): Promise<{ rows: ModelType[]; rowCount: number }>;

  abstract read<Key extends string & keyof ModelType>(
    whereKey: Key,
    value: string
  ): Promise<ModelType>;

  abstract update<Key extends string & keyof ModelType>(
    whereKey: Key,
    value: string,
    data: Record<string, unknown>
  ): Promise<ModelType>;

  abstract delete<Key extends string & keyof ModelType>(
    whereKey: Key,
    value: string
  ): Promise<boolean>;
}

export * from './errors.js';
