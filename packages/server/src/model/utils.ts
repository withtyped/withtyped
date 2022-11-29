import type { CamelCase, PrimitiveType, PrimitiveTypeMap, RawParserConfig } from './types.js';

export const normalizeString = (raw: string) =>
  raw.toLowerCase().replaceAll('\n', ' ').trim().replaceAll(/ {2,}/g, ' ');

// eslint-disable-next-line complexity
export const findType = (raw?: string): PrimitiveType | undefined => {
  if (!raw) {
    return;
  }

  // Should match `NumberType`
  if (
    raw.includes('int') ||
    raw.endsWith('serial') ||
    ['decimal', 'numeric', 'real'].includes(raw) ||
    raw.startsWith('timestamp')
  ) {
    return 'number';
  }

  if (raw.startsWith('bool')) {
    return 'boolean';
  }

  if (raw.startsWith('varchar') || raw === 'text') {
    return 'string';
  }

  if (['json', 'jsonb'].includes(raw)) {
    return 'json';
  }
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
      const [name, rawType, ...rest] = rawColumn.trim().split(' ');
      const props = rest.join(' ');
      const type = findType(rawType);

      if (!name || !type) {
        return;
      }

      return [
        name,
        {
          type,
          isArray: props.includes('array'),
          isNullable: !props.includes('not null'),
          hasDefault: props.includes('default'),
        },
      ];
    })
    .filter(Boolean) as Array<[string, RawParserConfig]>;

  return Object.fromEntries(columns);
};

export const testType = (
  value: unknown,
  type: PrimitiveType
): value is PrimitiveTypeMap[typeof type] => {
  switch (type) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'number':
      return typeof value === 'number';
    case 'string':
      return typeof value === 'string';
    case 'json':
      return isObject(value); // TODO: Perform more strict check
    default:
      throw new TypeError(`Unexpected type ${String(type)}`);
  }
};

// No need for this in TS 4.9, but VSCode not support yet
// See https://devblogs.microsoft.com/typescript/announcing-typescript-4-9-rc/#unlisted-property-narrowing-with-the-in-operator
export const isObject = (
  value: unknown
  // eslint-disable-next-line @typescript-eslint/ban-types
): value is object & Record<string, unknown> => typeof value === 'object' && value !== null;

export const camelCase = <T extends string>(value: T): CamelCase<T> =>
  // eslint-disable-next-line no-restricted-syntax
  value
    .split('_')
    .map((value, index) => (index === 0 ? value : (value[0] ?? '').toUpperCase() + value.slice(1)))
    .join('') as CamelCase<T>;
