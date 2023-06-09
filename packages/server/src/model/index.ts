import { z } from 'zod';

import type {
  Entity,
  EntityHasDefaultKeys,
  ModelCreateType,
  ModelExtendConfig,
  ModelExtendConfigWithDefault,
  ModelParseReturnType,
  ModelParseType,
  ModelPatchType,
  NormalizedBody,
  RawParserConfig,
  SplitRawColumns,
  TableName,
} from './types.js';
import { camelCaseKeys, parseRawConfigs, parseTableName } from './utils.js';
import { convertConfigToZod } from './utils.zod.js';

export type ModelZodObject<M> = z.ZodObject<{
  // Without the `-?` here Zod will infer those optional key types
  // to `unknown` which is unexpected.
  [Key in keyof M]-?: z.ZodType<M[Key]>;
}>;

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

  /** Alias of {@link getGuard()}. */
  public readonly guard = this.getGuard;
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

  // TODO: Make `default` compatible with nullable types
  /**
   * Use a customized parser (guard) for the given key. Affects all model parsers.
   *
   * NOTE: Has no effect to sql helpers.
   *
   * @see {@link convertConfigToZod} For how it affects model guards.
   */
  extend<Key extends string & keyof ModelType, Type>(
    key: Key,
    parser: z.ZodType<Type>
  ): Model<
    Table,
    { [key in keyof ModelType]: key extends Key ? Type : ModelType[key] },
    DefaultKeys,
    ReadonlyKeys
  >;
  /**
   * Use a programmatic default value for the given key with an optional customized parser (guard).
   * The customized parser affects all model parsers.
   *
   * NOTE: Has no effect to sql helpers.
   *
   * @see {@link convertConfigToZod} For how it affects model guards.
   */
  extend<Key extends string & keyof ModelType, Type>(
    key: Key,
    config: ModelExtendConfigWithDefault<Type>
  ): Model<
    Table,
    { [key in keyof ModelType]: key extends Key ? Type : ModelType[key] },
    DefaultKeys | Key,
    ReadonlyKeys
  >;
  /**
   * Mark a key with default value readonly.
   *
   * NOTE: Has no effect to sql helpers.
   *
   * @see {@link convertConfigToZod} For how it affects model guards.
   */
  extend<Key extends string & DefaultKeys>(
    key: Key,
    config: Pick<ModelExtendConfigWithDefault<unknown, true>, 'readonly'>
  ): Model<Table, ModelType, DefaultKeys, ReadonlyKeys | Key>;
  /**
   * Use a programmatic default value for the given key with an optional customized parser (guard).
   * The customized parser affects all model parsers.
   *
   * NOTE: Has no effect to sql helpers.
   *
   * @see {@link convertConfigToZod} For how it affects model guards.
   */
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
    config:
      | z.ZodType<Type>
      | ModelExtendConfigWithDefault<Type, RO>
      | Pick<ModelExtendConfigWithDefault<unknown, true>, 'readonly'>
  ): Model<
    Table,
    { [key in keyof ModelType]: key extends Key ? Type : ModelType[key] },
    string,
    string
  > {
    return new Model(
      this.raw,
      Object.freeze({
        ...this.extendedConfigs,
        [key]: {
          ...this.extendedConfigs[key],
          ...(config instanceof z.ZodType ? { parser: config } : config),
        },
      }),
      this.excludedKeys
    );
  }

  /** Exclude a key from the model. */
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

  /**
   * Get the 'model' zod guard of the current model.
   *
   * @see {@link convertConfigToZod} For details of model guards.
   */
  getGuard<ForType extends ModelParseType = 'model'>(): ModelZodObject<
    ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>[ForType]
  >;
  /**
   * Get the related zod guard of the current model.
   *
   * @param forType One of 'model' (default), 'create', or 'patch'.
   * @see {@link InferModelCreate} For what will be transformed for a create type guard.
   * @see {@link InferModelPatch} For what will be transformed for a patch type guard.
   * @see {@link convertConfigToZod} For details of model guards.
   */
  getGuard<ForType extends ModelParseType>(
    forType: ForType
  ): ModelZodObject<ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>[ForType]>;
  getGuard<ForType extends ModelParseType = 'model'>(
    forType?: ForType
  ): ModelZodObject<ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>[ForType]> {
    // eslint-disable-next-line @silverhand/fp/no-let
    let guard = z.object({});

    // Merge config first
    for (const [key, rawConfig] of Object.entries(this.rawConfigs)) {
      if (this.excludedKeySet.has(key) || key in guard.shape) {
        continue;
      }

      const parser = convertConfigToZod(rawConfig, this.extendedConfigs[key], forType ?? 'model');

      if (parser) {
        // eslint-disable-next-line @silverhand/fp/no-mutation
        guard = guard.extend({ [key]: parser });
      }
    }

    // eslint-disable-next-line no-restricted-syntax
    return guard as ModelZodObject<
      ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>[ForType]
    >;
  }

  /**
   * Parse the given data using the 'model' guard. Kebab-case and snake_case fields will be camelCased.
   *
   * @param data The data to parse.
   * @see {@link convertConfigToZod} For details of model guards.
   * @throws `ZodError` when parse failed.
   */
  parse(data: unknown): ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>['model'];
  /**
   * Parse the given data using a designated model guard. Kebab-case and snake_case fields will be camelCased.
   *
   * @param data The data to parse.
   * @param forType Use which guard to parse. One of 'model' (default), 'create', or 'patch'.
   * @see {@link InferModelCreate} For what will be transformed for a create type guard.
   * @see {@link InferModelPatch} For what will be transformed for a patch type guard.
   * @see {@link convertConfigToZod} For details of model guards.
   * @throws `ZodError` when parse failed.
   */
  parse<ForType extends ModelParseType>(
    data: unknown,
    forType: ForType
  ): ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>[ForType];
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

/** Infers the model type of a given model class. */
export type InferModel<M> = M extends Model<string, infer A> ? A : never;

/** Alias of {@link InferModel}. */
export type InferModelType<M> = InferModel<M>;

/**
 * Infers the model creation type of a given model class.
 *
 * The model creation type makes the original model fields with default value optional,
 * and forces readonly fields to be set as `undefined`.
 */
export type InferModelCreate<M> = M extends Model<
  string,
  infer ModelType,
  infer DefaultKeys,
  infer ReadonlyKeys
>
  ? ModelCreateType<ModelType, DefaultKeys, ReadonlyKeys>
  : never;

/**
 * Infers the model patch type of a given model class.
 *
 * The model patch type makes all fields optional, except readonly fields are omitted.
 */
export type InferModelPatch<M> = M extends Model<
  string,
  infer ModelType,
  string,
  infer ReadonlyKeys
>
  ? ModelPatchType<ModelType, ReadonlyKeys>
  : never;

export * from './types.js';
export * from './utils.js';
