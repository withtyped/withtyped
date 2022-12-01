import type { Parser } from '../types.js';
import type {
  CreateEntity,
  Entity,
  IdKeys,
  NormalizedBody,
  PrimaryKey,
  RawParserConfig,
  SplitRawColumns,
  TableName,
} from './types.js';
import {
  camelCase,
  isObject,
  parsePrimitiveType,
  parseRawConfigs,
  parseTableName,
} from './utils.js';

export default class Model<
  /* eslint-disable @typescript-eslint/ban-types */
  Table extends string = '',
  CreateType extends Record<string, unknown> = {},
  ModelType extends CreateType = CreateType,
  IdKey extends string = never,
  ExtendGuard extends Record<string, Parser<unknown>> = {}
  /* eslint-enable @typescript-eslint/ban-types */
> {
  static create = <Raw extends string>(raw: Raw) => {
    type Normalized = NormalizedBody<Raw>;

    type Columns = SplitRawColumns<Normalized>;

    return new Model<
      TableName<Raw>,
      CreateEntity<Columns>,
      Entity<Columns>,
      PrimaryKey<Normalized>
    >(raw, Object.freeze({}));
  };

  public readonly tableName: Table;
  public readonly rawConfigs: Record<string | number | symbol, RawParserConfig>;

  constructor(public readonly raw: string, public readonly extendedConfigs: ExtendGuard) {
    const tableName = parseTableName(raw);

    if (!tableName) {
      throw new TypeError('Table name not found in query');
    }

    // eslint-disable-next-line no-restricted-syntax
    this.tableName = tableName as Table;
    this.rawConfigs = parseRawConfigs(raw);
  }

  get keys() {
    return Object.keys(this.rawConfigs);
  }

  isIdKey(key: keyof ModelType): key is IdKeys<ModelType> {
    return ['string', 'number'].includes(this.rawConfigs[key].type);
  }

  extend<Key extends keyof ModelType, Type>(key: Key, parser: Parser<Type>) {
    return new Model<
      Table,
      Omit<CreateType, Key> & { [key in Key]: Type },
      Omit<ModelType, Key> & { [key in Key]: Type },
      IdKey,
      ExtendGuard & { [key in Key]: Parser<Type> }
    >(
      this.raw,
      Object.freeze(
        // eslint-disable-next-line no-restricted-syntax
        { ...this.extendedConfigs, [key]: parser } as ExtendGuard & { [key in Key]: Parser<Type> }
      )
    );
  }

  parse(data: unknown): ModelType;
  parse(data: unknown, forType: 'create'): CreateType;
  parse(data: unknown, forType: 'patch'): Partial<CreateType>;
  // eslint-disable-next-line complexity
  parse(data: unknown, forType?: 'create' | 'patch'): ModelType | CreateType | Partial<CreateType> {
    if (!isObject(data)) {
      throw new TypeError('Data is not an object');
    }

    const result: Record<string, unknown> = {};

    /* eslint-disable @silverhand/fp/no-mutation */
    for (const [key, config] of Object.entries(this.extendedConfigs)) {
      const camelCaseKey = camelCase(key);
      const value = data[key] === undefined ? data[camelCaseKey] : data[key];

      if (
        value === undefined &&
        ((forType === 'create' && Boolean(this.rawConfigs[key]?.hasDefault)) || forType === 'patch')
      ) {
        continue;
      }

      result[camelCaseKey] = config.parse(value);
    }

    for (const [key, config] of Object.entries(this.rawConfigs)) {
      const camelCaseKey = camelCase(key);

      if (key in this.extendedConfigs || camelCaseKey in this.extendedConfigs) {
        continue;
      }

      const value = data[key] === undefined ? data[camelCaseKey] : data[key];

      if (value === null) {
        if (config.isNullable) {
          result[camelCaseKey] = null;
          continue;
        } else {
          throw new TypeError(`Key \`${key}\` is not nullable but received ${String(value)}`);
        }
      }

      if (value === undefined) {
        if ((forType === 'create' && config.hasDefault) || forType === 'patch') {
          continue;
        } else {
          throw new TypeError(
            `Key \`${key}\` received unexpected ${String(
              value
            )}. If you are trying to provide an explicit empty value, use null instead.`
          );
        }
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

        result[camelCaseKey] = parsed;
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

        result[camelCaseKey] = parsed;
        continue;
      }
    }
    /* eslint-enable @silverhand/fp/no-mutation */

    // eslint-disable-next-line no-restricted-syntax
    return result as ModelType | CreateType | Partial<CreateType>;
  }
}
