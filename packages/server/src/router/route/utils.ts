import type { Guarded, Params, RequestGuard } from '../types.js';
import { normalizePathname } from '../utils.js';

// Consider build params during matching routes to improve efficiency
/**
 * Parse `match`'s path segments start with `:` with the value of the same index in the `url`'s path segments into an object.
 * This function assumes `match` has been normalized.
 *
 * E.g.
 * ```ts
 * parsePathParams('/foo/:bar/:baz', new URL('/foo/123/abc', base)) // { bar: '123', baz: 'abc' }
 * parsePathParams('/foo/:bar/:baz', new URL('/foo/123', base)) // { bar: '123', baz: '' }
 * ```
 */
export const parsePathParams = <Path extends string>(
  match: Path,
  { pathname }: URL
): Params<Path> => {
  const params: Record<string, string> = {};
  const urlParts = pathname.split('/');
  const matchParts = match.split('/');

  for (const [index, value] of matchParts.entries()) {
    if (value.startsWith(':')) {
      // eslint-disable-next-line @silverhand/fp/no-mutation
      params[value.slice(1)] = urlParts[index] ?? '';
    }
  }

  // Yes I'm sure what I'm doing
  // eslint-disable-next-line no-restricted-syntax
  return params as Params<Path>;
};

/**
 * Parse URLSearchParams to an key-value object. If a key appears multiple times, the value will be an array.
 *
 * E.g.
 * ```ts
 * searchParamsToObject(new URLSearchParams('?foo=1&bar=2')) // { foo: '1', bar: '2' }
 * searchParamsToObject(new URLSearchParams('?foo=1&bar=2&foo=%5Ea')) // { foo: ['1', '^a'], bar: '2' }
 * ```
 */
export const searchParamsToObject = (
  urlSearchParams: URLSearchParams
): Record<string, string | string[]> => {
  const object: Record<string, string | string[]> = {};

  // Use the mutating approach to get better performance
  /* eslint-disable @silverhand/fp/no-mutation, @silverhand/fp/no-mutating-methods */
  for (const [key, value] of urlSearchParams.entries()) {
    const result = object[key];

    if (Array.isArray(result)) {
      result.push(value);
      continue;
    }

    if (typeof result === 'string') {
      object[key] = [result, value];
      continue;
    }

    object[key] = value;
  }
  /* eslint-enable @silverhand/fp/no-mutation, @silverhand/fp/no-mutating-methods */

  return object;
};

export const guardInput = <Path extends string, Search, Body>(
  prefix: string,
  path: Path,
  url: URL,
  body: unknown,
  guard: RequestGuard<Search, Body, unknown>
  // eslint-disable-next-line max-params
): Guarded<Path, Search, Body> =>
  // The compiler cannot infer the output
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, no-restricted-syntax
  ({
    params: parsePathParams(normalizePathname(prefix + path), url),
    search: guard.search?.parse(searchParamsToObject(url.searchParams)),
    body: guard.body?.parse(body),
  } as Guarded<Path, Search, Body>);
