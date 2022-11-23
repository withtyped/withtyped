import { tryThat } from '../utils.js';
import type { Guarded, Params, RequestGuard, RouteHandler } from './types.js';

/**
 * Test if the pathname of the given URL matches the handler.
 * The function assumes the handler path has been normalized.
 *
 * @returns `true` if the pathname matches the handler.
 */
export const matchRoute = (handler: RouteHandler, url: URL): boolean => {
  const urlParts = url.pathname.split('/');
  const matchParts = handler.path.split('/');

  if (urlParts.length !== matchParts.length) {
    return false;
  }

  return matchParts.every((part, index) =>
    // Tested length above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    part.startsWith(':') ? true : part === tryThat(() => decodeURI(urlParts[index]!))
  );
};

// Consider build params during matching routes to improve efficiency
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

  // TODO: Add UTs
  // Yes I'm sure what I'm doing
  // eslint-disable-next-line no-restricted-syntax
  return params as Params<Path>;
};

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
    }

    object[key] = value;
  }
  /* eslint-enable @silverhand/fp/no-mutation, @silverhand/fp/no-mutating-methods */

  return object;
};

export const guardInput = <Path extends string, Query, Body>(
  path: Path,
  url: URL,
  body: unknown,
  guard: RequestGuard<Query, Body, unknown>
): Guarded<Path, Query, Body> =>
  // The compiler cannot infer the output
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, no-restricted-syntax
  ({
    params: parsePathParams(path, url),
    query: guard.query?.parse(searchParamsToObject(url.searchParams)),
    body: guard.body?.parse(body) ?? {},
  } as Guarded<Path, Query, Body>);
