import { normalizePathname } from '@withtyped/shared';

import type { RequestContext } from '../middleware/with-request.js';
import { tryThat } from '../utils.js';

import type { RouteLike } from './route/index.js';

/**
 * Test if the pathname of the given URL matches the route.
 *
 * @returns `true` if the pathname matches the route.
 */
export const matchRoute = <InputContext extends RequestContext>(
  route: RouteLike<InputContext>,
  url: URL
): boolean => {
  const urlParts = normalizePathname(url.pathname).split('/').filter(Boolean);
  const matchParts = normalizePathname(route.fullPath).split('/').filter(Boolean);

  if (urlParts.length !== matchParts.length) {
    return false;
  }

  return matchParts.every((part, index) =>
    // Tested length above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    part.startsWith(':') ? true : part === tryThat(() => decodeURI(urlParts[index]!))
  );
};
