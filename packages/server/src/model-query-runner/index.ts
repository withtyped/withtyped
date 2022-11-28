import type Model from '../model/index.js';

export default class ModelQueryRunner<
  /* eslint-disable @typescript-eslint/ban-types */
  Table extends string,
  CreateType = {},
  ModelType extends CreateType = CreateType
  /* eslint-enable @typescript-eslint/ban-types */
> {
  constructor(public readonly model: Model<Table, CreateType, ModelType>) {}

  async create(data: CreateType): Promise<ModelType> {
    console.log('create', data);

    return this.model.parse({});
  }

  async readAll(): Promise<ModelType[]> {
    return [];
  }

  async read<Key extends keyof ModelType>(byKey: Key, value: string): Promise<ModelType> {
    return this.model.parse({});
  }

  async update<Key extends keyof ModelType>(
    byKey: Key,
    value: string,
    data: Partial<CreateType>
  ): Promise<ModelType> {
    return this.model.parse({});
  }

  async delete<Key extends keyof ModelType>(byKey: Key, value: string): Promise<boolean> {
    return true;
  }
}
