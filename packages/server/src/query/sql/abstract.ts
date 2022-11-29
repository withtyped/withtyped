import type { Json } from '../../types.js';

export default abstract class Sql<PrimitiveType = unknown> {
  constructor(public readonly strings: TemplateStringsArray, public readonly args: Json[]) {}

  abstract get composed(): { raw: string; args: PrimitiveType[] };
}

export const createSqlTag =
  <SqlTag extends Sql>(Tag: new (strings: TemplateStringsArray, args: Json[]) => SqlTag) =>
  (strings: TemplateStringsArray, ...args: Json[]) =>
    new Tag(strings, args);
