import type { Json } from '../types.js';

export type PrimitiveType = 'string' | 'number' | 'boolean' | 'json';

export type NumberType =
  | `${string}int${string}`
  | `${string}serial`
  | 'decimal'
  | 'numeric'
  | 'real'
  | `timestamp${string}`;

export type StringType = `varchar(${string})` | 'text';

export type JsonType = 'json' | 'jsonb';

export type DataType<T extends string> = T extends NumberType
  ? number
  : T extends StringType
  ? string
  : T extends JsonType
  ? Json
  : never;

// TODO: Need clear docs for the transpilation
export type ColumnNotNull<T> = T extends `${string}not null${string}` ? true : false;
export type ColumnHasDefault<T> = T extends `${string}default${string}` ? true : false;
export type ColumnIsArray<T> = T extends `${string}array${string}` ? true : false;

export type ColumnLiteral<T> = T extends `${infer Name} ${infer Type} ${infer Props}`
  ? [Name, DataType<Type>, ColumnNotNull<Props>, ColumnHasDefault<Props>, ColumnIsArray<Props>]
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
        ? // eslint-disable-next-line @typescript-eslint/ban-types
          ColumnType<Entry> | null
        : ColumnType<Entry>;
    };

export type RawParserConfig = {
  type: PrimitiveType;
  isArray: boolean;
  isNullable: boolean;
};

export type Entity<Raw extends string> = RawModel<SplitRawColumns<Normalize<CreateTableBody<Raw>>>>;
export type CreateEntity<Raw extends string> = RawCreateModel<
  SplitRawColumns<Normalize<CreateTableBody<Raw>>>
>;
