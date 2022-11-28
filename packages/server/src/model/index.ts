import type { Merge, Parser } from '../types.js';
import type { CreateEntity, Entity, RawParserConfig } from './types.js';
import { camelCase, isObject, parseRawConfigs, parseTableName, testType } from './utils.js';

export default class Model<
  /* eslint-disable @typescript-eslint/ban-types */
  ModelType = {},
  CreateType = {},
  ExtendGuard extends Record<string, Parser<unknown>> = {}
  /* eslint-enable @typescript-eslint/ban-types */
> {
  static create = <Raw extends string>(raw: Raw) =>
    new Model<Entity<Raw>, CreateEntity<Raw>>(raw, Object.freeze({}));

  protected tableName?: string;
  protected rawConfigs: Record<string, RawParserConfig>;
  protected rawCreateConfigs: Record<string, RawParserConfig>;

  constructor(public readonly raw: string, public readonly extendedConfigs: ExtendGuard) {
    this.tableName = parseTableName(raw);
    this.rawConfigs = parseRawConfigs(raw);
    this.rawCreateConfigs = parseRawConfigs(raw, true);
    console.log(this.tableName);
    console.log(this.rawConfigs);
  }

  extend<Key extends keyof ModelType, Type>(key: Key, parser: Parser<Type>) {
    return new Model<
      Merge<ModelType, { [key in Key]: Type }>,
      Merge<CreateType, { [key in Key]: Type }>,
      Merge<ExtendGuard, { [key in Key]: Parser<Type> }>
    >(
      this.raw,
      Object.freeze(
        // eslint-disable-next-line no-restricted-syntax
        { ...this.extendedConfigs, [key]: parser } as Merge<
          ExtendGuard,
          { [key in Key]: Parser<Type> }
        >
      )
    );
  }

  // eslint-disable-next-line complexity
  parse(data: unknown): ModelType {
    if (!isObject(data)) {
      throw new TypeError('Data is not an object');
    }

    const result: Record<string, unknown> = {};

    for (const [key, config] of Object.entries(this.rawConfigs)) {
      const camelCaseKey = camelCase(key);
      const value = data[key] ?? data[camelCaseKey];

      if (value === null || value === undefined) {
        if (config.isNullable) {
          // eslint-disable-next-line @silverhand/fp/no-mutation
          result[camelCaseKey] = null;
          continue;
        } else {
          throw new TypeError(`Key \`${key}\` is not nullable but received ${String(value)}`);
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

      // eslint-disable-next-line @silverhand/fp/no-mutation
      result[camelCaseKey] = data[key];
    }

    // eslint-disable-next-line no-restricted-syntax
    return result as ModelType;
  }
}

export type Infer<M extends Model> = M extends Model<infer DataType> ? DataType : never;
