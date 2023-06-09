import type { JsonArray, JsonObject, Parser } from '../types.js';

export type PrimitiveType = 'string' | 'number' | 'boolean' | 'json' | 'date';

export type PrimitiveTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  json: JsonObject | JsonArray;
  date: Date;
};
// Should work in TS 4.9, wait for VSCode support: satisfies Record<PrimitiveType, unknown>

// This section should match `findType()` in `utils.ts`
export type NumberType =
  | `${string}int${string}`
  | `${string}serial`
  | 'decimal'
  | 'numeric'
  | 'real';

export type DateType = `timestamp${string}`;

export type StringType = `varchar${string}` | 'text';

export type BooleanType = `bool${string}`;

export type JsonType = 'json' | 'jsonb';

export type DataType<T extends string> = T extends NumberType
  ? number
  : T extends DateType
  ? Date
  : T extends StringType
  ? string
  : T extends JsonType
  ? JsonObject | JsonArray
  : never;

// TODO: Need clear docs for the transpilation
export type ColumnNotNull<T> = T extends `${string}not null${string}` ? true : false;
export type ColumnHasDefault<T> = T extends `${string}default${string}` ? true : false;
export type ColumnIsArray<T> = T extends `${string}array${string}` ? true : false;

export type ColumnLiteral<T> = T extends `${infer Name} ${infer Type} ${infer Props}`
  ? Name extends 'constraint' | 'like' | 'primary' | 'foreign'
    ? never
    : [Name, DataType<Type>, ColumnNotNull<Props>, ColumnHasDefault<Props>, ColumnIsArray<Props>]
  : T extends `${infer Name} ${infer Type}`
  ? [Name, DataType<Type>, false, false, false]
  : never;
export type ColumnNonNullableType<T extends unknown[]> = T[4] extends true ? Array<T[1]> : T[1];
export type ColumnType<T extends unknown[]> = T[2] extends true
  ? ColumnNonNullableType<T>
  : // eslint-disable-next-line @typescript-eslint/ban-types
    ColumnNonNullableType<T> | null;

export type Normalize<T> = T extends `${infer A}  ${infer B}`
  ? Normalize<`${A} ${B}`>
  : T extends `${infer A}\n${infer B}`
  ? Normalize<`${A}${B}`>
  : T extends ` ${infer A}`
  ? Normalize<A>
  : T extends `${infer A} `
  ? Normalize<A>
  : T;

export type CreateTableBody<T extends string> =
  Lowercase<T> extends `${string}create table${string}(${infer Body});${string}` ? Body : never;

export type SplitRawColumns<T extends string> = T extends `${infer A},${infer B}`
  ? [ColumnLiteral<Normalize<A>>, ...SplitRawColumns<B>]
  : [ColumnLiteral<Normalize<T>>];

export type CamelCase<T> = T extends `${infer A}_${infer B}`
  ? `${A}${Capitalize<CamelCase<B>>}`
  : T;

export type RawModel<S extends Array<[string, unknown]>> = S extends never
  ? S
  : {
      [Entry in S[number] as CamelCase<Entry[0]>]: ColumnType<Entry>;
    };

export type RawCreateModel<S extends Array<[string, unknown]>> = S extends never
  ? S
  : {
      [Entry in S[number] as CamelCase<Entry[0]>]: Entry[3] extends true
        ? ColumnType<Entry> | undefined
        : ColumnType<Entry>;
    };

export type RawParserConfig = {
  rawKey: string;
  type: PrimitiveType;
  isArray: boolean;
  isNullable: boolean;
  hasDefault: boolean;
};

export type AfterLastSpace<S> = S extends `${string} ${infer A}` ? AfterLastSpace<A> : S;

export type TableName<Raw extends string> =
  Lowercase<Raw> extends `${string}create ${string}table ${infer Name}(${string}`
    ? AfterLastSpace<Normalize<Name>>
    : never;

export type NormalizedBody<Raw extends string> = Normalize<CreateTableBody<Raw>>;
export type Entity<Columns extends Array<ColumnLiteral<string>>> = RawModel<Columns>;
export type EntityHasDefaultKeys<Columns extends Array<ColumnLiteral<string>>> = CamelCase<
  Extract<Columns[number], [string, unknown, boolean, true, boolean]>[0]
>;

// TODO: Support multiple keys
export type ColumnPrimaryKey<Column extends string> =
  Column extends `${infer Name} ${string} ${string}primary key${string}` ? Name : never;
export type PrimaryKey<NormalizedBody extends string> =
  NormalizedBody extends `${infer A},${infer B}`
    ? ColumnPrimaryKey<A> extends never
      ? PrimaryKey<B>
      : ColumnPrimaryKey<A>
    : ColumnPrimaryKey<NormalizedBody>;

export type KeyOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: unknown;
} &
  string;

export type IdKeys<T> = KeyOfType<T, string | number>;

export type DefaultIdKey<T> = 'id' extends keyof T ? 'id' : never;

export type ModelPatchType<ModelType, ReadonlyKeys extends keyof ModelType = never> = Partial<
  Omit<ModelType, ReadonlyKeys>
>;

export type ModelCreateType<
  ModelType,
  DefaultKeys extends keyof ModelType,
  ReadonlyKeys extends keyof ModelType = never
> = Omit<
  Omit<ModelType, DefaultKeys> & {
    [key in DefaultKeys]?: ModelType[key];
  },
  ReadonlyKeys
>;

export type ModelParseType = 'model' | 'create' | 'patch';
export type ModelParseReturnType<
  ModelType,
  DefaultKeys extends keyof ModelType,
  ReadonlyKeys extends keyof ModelType = never
> = {
  model: ModelType;
  create: ModelCreateType<ModelType, DefaultKeys, ReadonlyKeys>;
  patch: ModelPatchType<ModelType, ReadonlyKeys>;
};

export type ModelExtendConfig<Type> = {
  parser?: Parser<Type>;
  default?: Type | (() => Type);
  readonly?: boolean;
};

// TODO: Allow readonly with database default
export type ModelExtendConfigWithDefault<Type, RO extends boolean = false> = Omit<
  ModelExtendConfig<Type>,
  'default' | 'readonly'
> & {
  /**
   * The programmatic default value for model creating ('create'). It overrides the customized parser's default value (if exists),
   * but does not effect other types of model guards (such as 'model' and 'patch').
   *
   */
  default: Type | (() => Type);
  /**
   * Indicates whether the model key is programmatically readonly.
   * This affects the 'create' and 'patch' model guards.
   *
   * When set to `true`, the 'create' model guard enforces the model key to be `undefined`.
   * To set a default value programmatically, use the `default` config;
   * no action is required if the model key has a database default value.
   */
  readonly?: RO;
};
