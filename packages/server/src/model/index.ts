import type { Parser } from '../types.js';
import type { CreateEntity, Entity, RawParserConfig, TableName } from './types.js';
import { camelCase, isObject, parseRawConfigs, parseTableName, testType } from './utils.js';

export default class Model<
  /* eslint-disable @typescript-eslint/ban-types */
  Table extends string = '',
  CreateType = {},
  ModelType extends CreateType = CreateType,
  ExtendGuard extends Record<string, Parser<unknown>> = {}
  /* eslint-enable @typescript-eslint/ban-types */
> {
  static create = <Raw extends string>(raw: Raw) =>
    new Model<TableName<Raw>, CreateEntity<Raw>, Entity<Raw>>(raw, Object.freeze({}));

  public tableName: Table;
  protected rawConfigs: Record<string, RawParserConfig>;

  constructor(public readonly raw: string, public readonly extendedConfigs: ExtendGuard) {
    const tableName = parseTableName(raw);

    if (!tableName) {
      throw new TypeError('Table name not found in query');
    }

    // eslint-disable-next-line no-restricted-syntax
    this.tableName = tableName as Table;
    this.rawConfigs = parseRawConfigs(raw);
    console.log(this.tableName);
    console.log(this.rawConfigs);
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
      const camelCaseKey = camelCase(key);
      const value = data[key] ?? data[camelCaseKey];

      result[camelCaseKey] = config.parse(value);
    }

    for (const [key, config] of Object.entries(this.rawConfigs)) {
      const camelCaseKey = camelCase(key);

      if (key in this.extendedConfigs || camelCaseKey in this.extendedConfigs) {
        continue;
      }

      const value = data[key] ?? data[camelCaseKey];

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
        if (
          !Array.isArray(value) &&
          // Should work in TS 4.9, wait for VSCode support
          // eslint-disable-next-line no-restricted-syntax
          !(value as unknown[]).every((element) => testType(element, config.type))
        ) {
          throw new TypeError(
            `Unexpected type for key \`${key}\`, expected an array of ${config.type}`
          );
        }
      } else if (!testType(value, config.type)) {
        throw new TypeError(
          `Unexpected type for key \`${key}\`, expected ${config.type} but received ${typeof value}`
        );
      }

      result[camelCaseKey] = data[key];
    }
    /* eslint-enable @silverhand/fp/no-mutation */

    // eslint-disable-next-line no-restricted-syntax
    return result as ModelType | CreateType | Partial<CreateType>;
  }
}

export type Infer<M extends Model> = M extends Model<string, infer DataType> ? DataType : never;
