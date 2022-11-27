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

export type ColumnLiteral<T> = T extends `${infer Name} ${infer Type} ${string}`
  ? [Name, DataType<Type>]
  : T extends `${infer Name} ${infer Type}`
  ? [Name, DataType<Type>]
  : never;

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
      [Entry in S[number] as CamelCase<Entry[0]>]: Entry[1];
    };

export type RawParserConfig = {
  type: PrimitiveType;
  isArray: boolean;
  isNullable: boolean;
};

export type Entity<Raw extends string> = RawModel<SplitRawColumns<Normalize<CreateTableBody<Raw>>>>;
