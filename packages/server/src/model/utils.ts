import { normalizeString } from '@withtyped/shared';

import type { JsonObject } from '../types.js';

import type { CamelCase, PrimitiveType, PrimitiveTypeMap, RawParserConfig } from './types.js';

export const findType = (raw?: string): PrimitiveType | undefined => {
  if (!raw) {
    return;
  }

  // Should match `NumberType`
  if (
    raw.includes('int') ||
    raw.endsWith('serial') ||
    ['decimal', 'numeric', 'real'].includes(raw)
  ) {
    return 'number';
  }

  if (raw.startsWith('timestamp')) {
    return 'date';
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
  const match = /create table ([^(]*) \(/.exec(normalizeString(raw));

  return match?.[1] ?? undefined;
};

/**
 * Parse a SQL string to column configs with camelCase keys.
 *
 * @param raw The raw SQL string.
 * @returns An object with camelCase keys, while their values are the column configs read from SQL.
 */
export const parseRawConfigs = (raw: string): Record<string, RawParserConfig> => {
  const matchBody = /create table [^()]+ \((.*)\);/.exec(normalizeString(raw));
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

      if (!name || !type || ['constraint', 'like'].includes(name)) {
        return;
      }

      return [
        camelCase(name),
        {
          type,
          rawKey: name,
          isArray: props.includes('array'),
          isNullable: !props.includes('not null'),
          hasDefault: props.includes('default'),
        },
      ];
    })
    .filter(Boolean) as Array<[string, RawParserConfig]>;

  return Object.fromEntries(columns);
};

const undefinedIfNaN = (number: number) => (Number.isNaN(number) ? undefined : number);

// eslint-disable-next-line complexity
export const parsePrimitiveType = (
  value: unknown,
  type: PrimitiveType
  // Investigate why we cannot use generic to perform strict type mapping
  // Or just wait for VSCode upgrade to TS 4.9 and try `satisfies`
): PrimitiveTypeMap[PrimitiveType] | undefined => {
  switch (type) {
    case 'boolean': {
      return typeof value === 'boolean' ? value : undefined;
    }

    case 'number': {
      if (typeof value === 'number') {
        return undefinedIfNaN(value);
      }

      if (typeof value === 'string') {
        return undefinedIfNaN(Number(value));
      }

      return;
    }
    case 'string': {
      return typeof value === 'string' ? value : undefined;
    }
    case 'json': {
      return isObject(value) || Array.isArray(value) ? value : undefined;
    } // TODO: Perform more strict check (make sure it is a json object)

    case 'date': {
      if (value instanceof Date) {
        return value;
      }

      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);

        return Number.isNaN(date.valueOf()) ? undefined : date;
      }

      return;
    }
    default: {
      throw new TypeError(`Unexpected type ${String(type)}`);
    }
  }
};

export const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' &&
  value !== null &&
  !(value instanceof RegExp) &&
  !(value instanceof Error) &&
  !(value instanceof Date);

export const camelCase = <T extends string>(value: T): CamelCase<T> => {
  // Convert to PascalCase first to prevent unexpected prefix or suffix
  const pascalCase = value
    .split(/[_-]/)
    .map((value, index) => (index === 0 ? value : (value[0] ?? '').toUpperCase() + value.slice(1)))
    .join('');

  // eslint-disable-next-line no-restricted-syntax
  return ((pascalCase[0] ?? '').toLowerCase() + pascalCase.slice(1)) as CamelCase<T>;
};

/**
 * Convert the top-level keys to camelCase if the value is a plain object.
 * If there are multiple keys with the same camelCase result, the value of that key will NOT be ensured.
 */
export const camelCaseKeys = (value: unknown) => {
  if (!isObject(value)) {
    return value;
  }

  return Object.fromEntries(Object.entries(value).map(([key, value]) => [camelCase(key), value]));
};
