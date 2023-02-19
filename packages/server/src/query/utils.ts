export abstract class Sql<OutputArg = unknown, InputArg = OutputArg> {
  constructor(public readonly strings: TemplateStringsArray, public readonly args: InputArg[]) {}

  public abstract compose(
    rawArray: string[],
    args: OutputArg[],
    indexInit?: number
  ): { lastIndex: number };
  abstract get composed(): { raw: string; args: OutputArg[] };
}

export const createDangerousRawSqlFunction =
  <SqlClass extends Sql>(
    Factory: new (strings: TemplateStringsArray, args: unknown[]) => SqlClass
  ) =>
  (raw: string) =>
    new Factory(Object.assign([raw], { raw: [raw] }), []);

export const createIdentifierSqlFunction =
  <SqlClass extends Sql>(
    Factory: new (strings: TemplateStringsArray, args: unknown[]) => SqlClass
  ) =>
  (...strings: string[]) =>
    new Factory(Object.assign([...strings], { raw: strings }), []);

export const createSqlTag =
  <ArgType, SqlClass extends Sql<unknown, ArgType>>(
    Factory: new (strings: TemplateStringsArray, args: ArgType[]) => SqlClass
  ) =>
  <T extends ArgType[]>(strings: TemplateStringsArray, ...args: T) =>
    new Factory(strings, args);
