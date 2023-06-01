import { z } from 'zod';

import type {
  Entity,
  EntityHasDefaultKeys,
  ModelExtendConfig,
  ModelExtendConfigWithDefault,
  ModelParseReturnType,
  ModelParseType,
  NormalizedBody,
  RawParserConfig,
  SplitRawColumns,
  TableName,
} from './types.js';
import { camelCaseKeys, parseRawConfigs, parseTableName } from './utils.js';
import { convertConfigToZod } from './utils.zod.js';

export type InferModelType<M> = M extends Model<string, infer A> ? A : never;
export type ModelZodObject<M> = {
  [Key in keyof M]: z.ZodType<M[Key]>;
};

export default class Model<
  Table extends string = '',
  // eslint-disable-next-line @typescript-eslint/ban-types
  ModelType extends Record<string, unknown> = {},
  DefaultKeys extends string = never,
  ReadonlyKeys extends string = never
> {
  static create = <Raw extends string>(raw: Raw) => {
    type Normalized = NormalizedBody<Raw>;

    type Columns = SplitRawColumns<Normalized>;

    return new Model<TableName<Raw>, Entity<Columns>, EntityHasDefaultKeys<Columns>, never>(
      raw,
      Object.freeze({}),
      []
    );
  };

  public readonly tableName: Table;
  public readonly rawConfigs: Record<string & keyof ModelType, RawParserConfig>;
  protected readonly excludedKeySet: Set<string>;

  constructor(
    public readonly raw: string,
    public readonly extendedConfigs: Record<string, ModelExtendConfig<unknown>>,
    public readonly excludedKeys: string[]
  ) {
    const tableName = parseTableName(raw);

    if (!tableName) {
      throw new TypeError('Table name not found in query');
    }

    // eslint-disable-next-line no-restricted-syntax
    this.tableName = tableName as Table;
    this.rawConfigs = parseRawConfigs(raw);
    this.excludedKeySet = new Set(this.excludedKeys);
  }

  get rawKeys(): Record<keyof ModelType, string> {
    // eslint-disable-next-line no-restricted-syntax
    return Object.fromEntries(
      Object.entries(this.rawConfigs)
        .filter(([key]) => !this.excludedKeySet.has(key))
        .map(([key, { rawKey }]) => [key, rawKey])
    ) as Record<keyof ModelType, string>;
  }

  // Indicates if `key` is `IdKeys<ModelType>`.
  isIdKey(key: string & keyof ModelType): boolean {
    if (!(key in this.rawConfigs) || this.excludedKeySet.has(key)) {
      return false;
    }

    // Just validated
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return ['string', 'number'].includes(this.rawConfigs[key]!.type);
  }

  // TODO: Make `default` compatible with nullable types
  extend<Key extends string & keyof ModelType, Type>(
    key: Key,
    config: ModelExtendConfigWithDefault<Type>
  ): Model<
    Table,
    { [key in keyof ModelType]: key extends Key ? Type : ModelType[key] },
    DefaultKeys | Key,
    ReadonlyKeys
  >;
  extend<Key extends string & keyof ModelType, Type, RO extends boolean>(
    key: Key,
    config: ModelExtendConfigWithDefault<Type, true>
  ): Model<
    Table,
    { [key in keyof ModelType]: key extends Key ? Type : ModelType[key] },
    DefaultKeys | Key,
    ReadonlyKeys | Key
  >;
  extend<Key extends string & keyof ModelType, Type, RO extends boolean>(
    key: Key,
    config: ModelExtendConfigWithDefault<Type, RO>
  ): Model<
    Table,
    { [key in keyof ModelType]: key extends Key ? Type : ModelType[key] },
    DefaultKeys | Key,
    ReadonlyKeys
  > {
    return new Model(
      this.raw,
      Object.freeze({
        ...this.extendedConfigs,
        [key]: config,
      }),
      this.excludedKeys
    );
  }

  exclude<Key extends string & keyof ModelType>(
    key: Key
  ): Model<
    Table,
    { [key in keyof ModelType as key extends Key ? never : key]: ModelType[key] },
    DefaultKeys,
    ReadonlyKeys
  > {
    return new Model(this.raw, this.extendedConfigs, this.excludedKeys.concat(key));
  }

  getGuard<ForType extends ModelParseType>(
    forType: ForType
  ): z.ZodObject<
    ModelZodObject<ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>[ForType]>
  > {
    // eslint-disable-next-line @silverhand/fp/no-let
    let guard = z.object({});

    // Merge config first
    for (const [key, rawConfig] of Object.entries(this.rawConfigs)) {
      if (this.excludedKeySet.has(key) || key in guard.shape) {
        continue;
      }

      const parser = convertConfigToZod(rawConfig, this.extendedConfigs[key], forType);

      if (parser) {
        // eslint-disable-next-line @silverhand/fp/no-mutation
        guard = guard.extend({ [key]: parser });
      }
    }

    // eslint-disable-next-line no-restricted-syntax
    return guard as z.ZodObject<
      ModelZodObject<ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>[ForType]>
    >;
  }

  parse<ForType extends ModelParseType = 'model'>(
    data: unknown,
    forType?: ForType
  ): ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>[ForType] {
    // eslint-disable-next-line no-restricted-syntax
    return this.getGuard(forType ?? 'model').parse(camelCaseKeys(data)) as ModelParseReturnType<
      ModelType,
      DefaultKeys,
      ReadonlyKeys
    >[ForType];
  }
}

export const createModel = Model.create;
export * from './types.js';
export * from './utils.js';
