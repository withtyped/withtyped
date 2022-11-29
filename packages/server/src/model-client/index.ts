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

  abstract read(id: string): Promise<ModelType>;

  abstract update(id: string, data: Partial<CreateType>): Promise<ModelType>;

  abstract delete(id: string): Promise<boolean>;
}
