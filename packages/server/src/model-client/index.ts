import type Model from '../model/index.js';

export default abstract class ModelClient<
  /* eslint-disable @typescript-eslint/ban-types */
  Table extends string,
  CreateType extends Record<string, unknown> = {},
  ModelType extends CreateType = CreateType
  /* eslint-enable @typescript-eslint/ban-types */
> {
  abstract readonly model: Model<Table, CreateType, ModelType>;

  abstract create(data: CreateType): Promise<ModelType>;

  abstract readAll(): Promise<{ rows: ModelType[]; rowCount: number }>;

  abstract read<Key extends keyof ModelType>(whereKey: Key, value: string): Promise<ModelType>;

  abstract update<Key extends keyof ModelType>(
    whereKey: Key,
    value: string,
    data: Partial<CreateType>
  ): Promise<ModelType>;

  abstract delete<Key extends keyof ModelType>(whereKey: Key, value: string): Promise<boolean>;
}

export * from './errors.js';
