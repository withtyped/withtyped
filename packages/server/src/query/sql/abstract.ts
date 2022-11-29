export default abstract class Sql<OutputArg = unknown, InputArg = OutputArg> {
  constructor(public readonly strings: TemplateStringsArray, public readonly args: InputArg[]) {}

  abstract get composed(): { raw: string; args: OutputArg[] };
}

export abstract class IdentifierSql extends Sql<never, never> {
  constructor(strings: string[]) {
    super(Object.assign([...strings], { raw: strings }), []);
  }
}

export const createIdentifierSqlFunction =
  <SqlClass extends IdentifierSql>(Factory: new (strings: string[]) => SqlClass) =>
  (...strings: string[]) =>
    new Factory(strings);

export const createSqlTag =
  <ArgType, SqlClass extends Sql<unknown, ArgType>>(
    Factory: new (strings: TemplateStringsArray, args: ArgType[]) => SqlClass
  ) =>
  (strings: TemplateStringsArray, ...args: ArgType[]) =>
    new Factory(strings, args);
