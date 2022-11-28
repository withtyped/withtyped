import type { Merge, Parser } from '../types.js';
import type { CreateEntity, Entity, RawParserConfig } from './types.js';
import { parseRawConfigs, parseTableName } from './utils.js';

export default class Model<
  ModelType = unknown,
  CreateType = unknown,
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendGuard extends Record<string, Parser<unknown>> = {}
> {
  static create = <Raw extends string>(raw: Raw) =>
    new Model<Entity<Raw>, CreateEntity<Raw>>(raw, Object.freeze({}));

  protected tableName?: string;
  protected rawConfigs: Record<keyof ModelType, RawParserConfig>;

  constructor(public readonly raw: string, public readonly extendedConfigs: ExtendGuard) {
    this.tableName = parseTableName(raw);
    // eslint-disable-next-line no-restricted-syntax
    this.rawConfigs = parseRawConfigs(raw) as typeof this.rawConfigs;
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

  // Parse(data: unknown): ModelType {}
}

export type Infer<M extends Model> = M extends Model<infer DataType> ? DataType : never;
