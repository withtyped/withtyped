// We use symbols instead of classes for identifiable types since TypeScript
// classes cannot have dynamic index signatures.

/**
 * The global symbol keys used to identify identifiable types.
 * Usually you don't need to use them directly.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#shared_symbols_in_the_global_symbol_registry | MDN: Shared symbols in the global symbol registry}
 */
export const idSymbolKeys = Object.freeze({
  model: '@withtyped/server/identifiable',
  column: '@withtyped/server/identifiable.column',
  updateColumn: '@withtyped/server/identifiable.update_column',
} as const);

/**
 * The symbol used to identify `IdentifiableModel` types. It should be used as
 * a property on the model object with the value of the model metadata.
 *
 * @see {@link IdentifiableModel}
 */
const identifiableSymbol = Symbol.for(idSymbolKeys.model);
/**
 * The symbol used to identify `IdentifiableColumn` types. It should be used as
 * a property on the column object with the value of `true`.
 *
 * @see {@link IdentifiableColumn}
 */
const identifiableColumnSymbol = Symbol.for(idSymbolKeys.column);
/**
 * The symbol used to identify `IdentifiableUpdateColumn` types. It should be
 * used as a property on the column object with the value of `true`.
 *
 * @see {@link IdentifiableUpdateColumn}
 */
const IdentifiableUpdateColumnSymbol = Symbol.for(idSymbolKeys.updateColumn);

/** The symbols used to identify identifiable types. */
export const idSymbols = Object.freeze({
  model: identifiableSymbol,
  column: identifiableColumnSymbol,
  updateColumn: IdentifiableUpdateColumnSymbol,
} as const);

export type IdentifiableModelMetadata = {
  /** The corresponding schema name in the database. */
  schema?: string;
  /** The corresponding table name in the database. */
  tableName: string;
};

/**
 * The identifiable type for models. It has a dynamic index signature to allow
 * for arbitrary column names; and a symbol property to save the model metadata.
 *
 * @example
 * ```ts
 * const foo = Model.create(`
 *   create table foo (id varchar(32) primary key not null, bar bigint);
 * `).identifiable;
 *
 * typeof foo; // IdentifiableModel<{ id: string; bar: number; }>;
 * foo[idSymbols.model]; // { tableName: 'foo' };
 * foo.id; // { [idSymbols.column]: true, name: 'id', model: { tableName: 'foo' } };
 * foo.id.update; // { [idSymbols.updateColumn]: true, name: 'id' };
 * foo.bar; // { [idSymbols.column]: true, name: 'bar', model: { tableName: 'foo' } };
 * ```
 *
 * It can also be use with a schema name:
 *
 * @example
 * ```ts
 * const foo = Model.create(`
 *   create table foo (id varchar(32) primary key not null, bar bigint);
 * `, 'baz').identifiable;
 *
 * typeof foo; // IdentifiableModel<{ id: string; bar: number; }>;
 * foo[idSymbols.model]; // { schema: 'baz', tableName: 'foo' };
 * foo.id; // { [idSymbols.column]: true, name: 'id', model: { schema: 'baz', tableName: 'foo' } };
 * foo.id.update; // { [idSymbols.updateColumn]: true, name: 'id' };
 * foo.bar; // { [idSymbols.column]: true, name: 'bar', model: { schema: 'baz', tableName: 'foo' } };
 * ```
 *
 * @see {@link idSymbols}
 */
export type IdentifiableModel<T extends Record<string, unknown>> = {
  [key in keyof T]: IdentifiableColumn;
} & { [idSymbols.model]: IdentifiableModelMetadata };

export type IdentifiableColumn = {
  [idSymbols.column]: true;
  /** The corresponding column name in the database. */
  name: string;
  /** The corresponding column name in the database. */
  model: IdentifiableModelMetadata;
  /** Get the identifiable value for column updates. */
  get update(): Readonly<IdentifiableUpdateColumn>;
};

/**
 * The identifiable type for column updates.
 * It is used to distinguish between column updates and column selections since
 * schema and table names are not allowed in column updates.
 */
export type IdentifiableUpdateColumn = {
  [idSymbols.updateColumn]: true;
  /** The corresponding column name in the database. */
  name: string;
};
