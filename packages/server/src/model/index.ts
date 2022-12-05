import type { Parser } from '../types.js';
import type {
  CreateEntity,
  Entity,
  NormalizedBody,
  RawParserConfig,
  SplitRawColumns,
  TableName,
} from './types.js';
import { isObject, parsePrimitiveType, parseRawConfigs, parseTableName } from './utils.js';

export default class Model<
  /* eslint-disable @typescript-eslint/ban-types */
  Table extends string = '',
  CreateType extends Record<string, unknown> = {},
  ModelType extends CreateType = CreateType,
  ExtendGuard extends Record<string, Parser<unknown>> = {}
  /* eslint-enable @typescript-eslint/ban-types */
> {
  static create = <Raw extends string>(raw: Raw) => {
    type Normalized = NormalizedBody<Raw>;

    type Columns = SplitRawColumns<Normalized>;

    return new Model<TableName<Raw>, CreateEntity<Columns>, Entity<Columns>>(
      raw,
      Object.freeze({})
    );
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

  get rawKeys() {
    return Object.values(this.rawConfigs).map(({ rawKey }) => rawKey);
  }

  // Indicates if `key` is `IdKeys<ModelType>`.
  // Cannot define as a type guard since it will affects generic array for `DatabaseInitializer`.
  isIdKey(key: keyof ModelType): boolean {
    if (!(key in this.rawConfigs)) {
      return false;
    }

    return ['string', 'number'].includes(this.rawConfigs[key].type);
  }

  extend<Key extends keyof ModelType, Type>(key: Key, parser: Parser<Type>) {
    return new Model<
      Table,
      Omit<CreateType, Key> & { [key in Key]: Type },
      Omit<ModelType, Key> & { [key in Key]: Type },
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const snakeCaseKey = this.rawConfigs[key]!.rawKey; // Should be ensured during init
      const value = data[key] === undefined ? data[snakeCaseKey] : data[key];

      if (value === undefined) {
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

      result[key] = config.parse(value);
    }

    for (const [key, config] of Object.entries(this.rawConfigs)) {
      const snakeCaseKey = config.rawKey;

      if (key in this.extendedConfigs || snakeCaseKey in this.extendedConfigs) {
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
    return result as ModelType | CreateType | Partial<CreateType>;
  }
}

export const createModel = Model.create;
export * from './types.js';
