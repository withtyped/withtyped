import type { Parser } from '../types.js';
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
import { isObject, parsePrimitiveType, parseRawConfigs, parseTableName } from './utils.js';

export type InferModelType<M> = M extends Model<string, infer A> ? A : never;

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
    parser: Parser<Type>
  ): Model<
    Table,
    { [key in keyof ModelType]: key extends Key ? Type : ModelType[key] },
    DefaultKeys,
    ReadonlyKeys
  >;
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
    config: Parser<Type> | ModelExtendConfigWithDefault<Type, RO>
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
        [key]: 'parse' in config ? { parser: config } : config,
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

  // eslint-disable-next-line complexity
  parse<ForType extends ModelParseType = 'model'>(
    data: unknown,
    forType?: ForType
  ): ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>[ForType] {
    if (!isObject(data)) {
      throw new TypeError('Data is not an object');
    }

    const result: Record<string, unknown> = {};

    /* eslint-disable @silverhand/fp/no-mutation */
    for (const [key, config] of Object.entries(this.extendedConfigs)) {
      if (this.excludedKeySet.has(key)) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const snakeCaseKey = this.rawConfigs[key]!.rawKey; // Should be ensured during init
      const value = data[key] === undefined ? data[snakeCaseKey] : data[key];

      if (
        forType &&
        ['create', 'patch'].includes(forType) &&
        config.readonly &&
        value !== undefined
      ) {
        throw new TypeError(
          `Key \`${key}\` is readonly but received ${String(
            value
          )}. It should be \`undefined\` for ${forType} usage.`
        );
      }

      if (value === undefined) {
        if (forType !== 'patch' && 'default' in config && config.default) {
          result[key] = typeof config.default === 'function' ? config.default() : config.default;
          continue;
        }

        if (
          (forType === 'create' && Boolean(this.rawConfigs[key]?.hasDefault)) ||
          forType === 'patch'
        ) {
          continue;
        }

        throw new TypeError(
          `Key \`${key}\` received unexpected ${String(
            value
          )}. If you are trying to provide an explicit empty value, use null instead.`
        );
      }

      result[key] = config.parser?.parse(value);
    }

    for (const [key, config] of Object.entries(this.rawConfigs)) {
      if (this.excludedKeySet.has(key)) {
        continue;
      }

      const snakeCaseKey = config.rawKey;

      // Handled by extendConfig
      if (result[key] !== undefined) {
        continue;
      }

      const value = data[key] === undefined ? data[snakeCaseKey] : data[key];

      if (value === null) {
        if (config.isNullable) {
          result[key] = null;
          continue;
        } else {
          throw new TypeError(`Key \`${key}\` is not nullable but received ${String(value)}`);
        }
      }

      if (value === undefined) {
        if ((forType === 'create' && config.hasDefault) || forType === 'patch') {
          continue;
        }

        throw new TypeError(
          `Key \`${key}\` received unexpected ${String(
            value
          )}. If you are trying to provide an explicit empty value, use null instead.`
        );
      }

      if (config.isArray) {
        const parsed =
          Array.isArray(value) && value.map((element) => parsePrimitiveType(element, config.type));

        // eslint-disable-next-line unicorn/no-useless-undefined
        if (!parsed || parsed.includes(undefined)) {
          throw new TypeError(
            `Unexpected type for key \`${key}\`, expected an array of ${config.type}`
          );
        }

        result[key] = parsed;
        continue;
      } else {
        const parsed = parsePrimitiveType(value, config.type);

        if (parsed === undefined) {
          throw new TypeError(
            `Unexpected type for key \`${key}\`, expected ${
              config.type
            } but received ${typeof value}`
          );
        }

        result[key] = parsed;
        continue;
      }
    }
    /* eslint-enable @silverhand/fp/no-mutation */

    // eslint-disable-next-line no-restricted-syntax
    return result as ModelParseReturnType<ModelType, DefaultKeys, ReadonlyKeys>[ForType];
  }
}

export const createModel = Model.create;
export * from './types.js';
export * from './utils.js';
