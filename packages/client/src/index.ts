import type { Router, BaseRoutes, GuardedPayload } from '@withtyped/server';
import type { RequestMethod } from '@withtyped/shared';
import { log, normalizePathname } from '@withtyped/shared';

import type {
  RouterClient,
  RouterRoutes,
  ClientRequestHandler,
  ClientPayload,
  ClientConfig,
  ClientConfigInit,
} from './types.js';
import { buildSearchString, tryJson } from './utils.js';

export default class Client<R extends Router, Routes extends BaseRoutes = RouterRoutes<R>>
  implements RouterClient<Routes>
{
  get = this.buildHandler('get');
  post = this.buildHandler('post');
  put = this.buildHandler('put');
  patch = this.buildHandler('patch');
  delete = this.buildHandler('delete');
  copy = this.buildHandler('copy');
  head = this.buildHandler('head');
  options = this.buildHandler('options');

  public readonly config: ClientConfig;

  constructor(baseUrl: ClientConfigInit['baseUrl']);
  constructor(config: ClientConfigInit);
  constructor(value: ClientConfigInit['baseUrl'] | ClientConfigInit) {
    if (typeof value === 'string' || value instanceof URL) {
      this.config = Object.freeze({ baseUrl: new URL(value), keepAlive: true });
    } else {
      const { baseUrl, ...rest } = value;
      this.config = Object.freeze({ baseUrl: new URL(baseUrl), keepAlive: true, ...rest });
    }

    log.debug(this.config);
  }

  private buildUrl(pathname: string, search?: Record<string, string | string[]>): URL {
    const { baseUrl } = this.config;
    const url = new URL(normalizePathname(baseUrl.pathname + pathname), baseUrl.origin);
    // Reassign to search to avoid unexpected `?`
    // eslint-disable-next-line @silverhand/fp/no-mutation
    url.search = buildSearchString(search);

    return url;
  }

  private buildPathname(path: string, parameters?: Record<string, string>): string {
    return path
      .split('/')
      .map((value) => {
        if (!value.startsWith(':')) {
          return value;
        }

        const key = value.slice(1);
        const parameter = parameters?.[key];

        if (!parameter) {
          throw new Error(`URL parameter ${key} not found`);
        }

        return parameter;
      })
      .join('/');
  }

  private buildHeaders(url: URL, method: Lowercase<RequestMethod>): Record<string, string> {
    const { headers } = this.config;

    return {
      'content-type': 'application/json; charset=utf-8',
      host: url.host,
      accept: 'application/json',
      ...(typeof headers === 'function' ? headers(url, method) : headers),
    };
  }

  private buildHandler<Method extends Lowercase<RequestMethod>>(method: Method) {
    type MethodRoutes = Routes[Method];

    const handler: ClientRequestHandler<MethodRoutes> = async <T extends keyof MethodRoutes>(
      path: T,
      payload?: GuardedPayload<MethodRoutes[T]>
    ) => {
      if (typeof path !== 'string') {
        throw new TypeError('Path is not string');
      }

      // We treat payload general and use code to make it works as expected
      // Type inference will always fall into the empty object result
      // eslint-disable-next-line no-restricted-syntax
      const { params, search, body } = (payload ?? {}) as ClientPayload;
      const pathname = this.buildPathname(path, params);

      const url = this.buildUrl(pathname, search);
      log.debug(method.toUpperCase(), url.href);

      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: this.buildHeaders(url, method),
        body:
          typeof body === 'string' || typeof body === 'undefined' || body === null
            ? body
            : JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Response status ${response.status}`);
      }

      // Trust backend since it has been guarded
      // eslint-disable-next-line no-restricted-syntax
      return tryJson(response) as ReturnType<ClientRequestHandler<Routes[Method]>>;
    };

    return handler;
  }
}
