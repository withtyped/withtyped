import type { IncomingMessage } from 'http';
import type { UrlWithParsedQuery } from 'node:url';
import url from 'node:url';

import type { Guarded, Params, RequestGuard, RouteHandler } from './types.js';

export const matchRoute = (handler: RouteHandler, request: IncomingMessage): boolean => {
  if (!request.url) {
    return false;
  }

  // `url.parse()` is deprecated. Change to `URL` class later.
  const urlParts = (url.parse(request.url).pathname ?? '').split('/');
  const matchParts = handler.path.split('/');

  if (urlParts.length !== matchParts.length) {
    return false;
  }

  return matchParts.every((part, index) =>
    part.startsWith(':') ? true : part === urlParts[index]
  );
};

// Consider build params during matching routes to improve efficiency
export const getParams = <Path extends string>(match: Path, { pathname }: UrlWithParsedQuery) => {
  const params: Record<string, string | string[]> = {};
  const urlParts = (pathname ?? '').split('/');
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

export const guardInput = <Path extends string, Query, Body>(
  path: Path,
  url: UrlWithParsedQuery,
  body: unknown,
  guard: RequestGuard<Query, Body, unknown>
): Guarded<Path, Query, Body> =>
  // The compiler cannot infer the output
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, no-restricted-syntax
  ({
    params: getParams(path, url),
    query: guard.query?.parse(url.query),
    body: guard.body?.parse(body) ?? {},
  } as Guarded<Path, Query, Body>);
