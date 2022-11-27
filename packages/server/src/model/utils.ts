import type { PrimitiveType, RawParserConfig } from './types.js';

const normalizeString = (raw: string) =>
  raw.toLowerCase().replaceAll('\n', ' ').trim().replaceAll(/ {2,}/g, ' ');

const findType = (raw?: string): PrimitiveType | undefined => {
  return 'string';
};

export const parseTableName = (raw: string): string | undefined => {
  const match = /create table (.*) \(/.exec(normalizeString(raw));

  return match?.[1] ?? undefined;
};

export const parseRawConfigs = (raw: string): Record<string, RawParserConfig> => {
  const matchBody = /create table [^ ]+ \((.*)\);/.exec(normalizeString(raw));
  const body = matchBody?.[1];

  if (!body) {
    return {};
  }

  // Use `as` in the end, since TypeScript cannot recognize `Boolean` as the type guard
  // eslint-disable-next-line no-restricted-syntax
  const columns = body
    .split(',')
    .map<[string, RawParserConfig] | undefined>((rawColumn) => {
      const [name, rawType] = rawColumn.trim().split(' ');
      const type = findType(rawType);

      if (!name || !type) {
        return;
      }

      return [
        name,
        {
          type,
          isArray: false,
          isNullable: false,
        },
      ];
    })
    .filter(Boolean) as Array<[string, RawParserConfig]>;

  return Object.fromEntries(columns);
};
