import { tryThat } from '../utils.js';
import type { RouteLike } from './route/index.js';

export const normalizePathname = (pathname: string) =>
  '/' + pathname.split('/').filter(Boolean).join('/');

/**
 * Test if the pathname of the given URL matches the handler.
 *
 * @returns `true` if the pathname matches the handler.
 */
export const matchRoute = (route: RouteLike, url: URL): boolean => {
  const urlParts = normalizePathname(url.pathname).split('/').filter(Boolean);
  const matchParts = normalizePathname(route.prefix + route.path)
    .split('/')
    .filter(Boolean);

  if (urlParts.length !== matchParts.length) {
    return false;
  }

  return matchParts.every((part, index) =>
    // Tested length above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    part.startsWith(':') ? true : part === tryThat(() => decodeURI(urlParts[index]!))
  );
};
