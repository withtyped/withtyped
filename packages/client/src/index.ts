import type { BaseRoutes, GuardedPayload, Router, RouterRoutes } from '@withtyped/server';
import { RequestMethod, contentTypes, log, normalizePathname } from '@withtyped/shared';

import type {
  RouterClient,
  ClientRequestHandler,
  ClientPayload,
  ClientConfig,
  ClientConfigInit,
} from './types.js';
import { buildSearch, isPromise, tryJson } from './utils.js';

export class ResponseError extends Error {
  constructor(public readonly response: Response) {
    super(`Response error ${response.status}: ${response.statusText}`);
  }

  get status() {
    return this.response.status;
  }
}

export default class Client<
  // Use `any` here to avoid context conflicts. The final type can be correctly inferred.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  R extends Router<any, BaseRoutes, string>,
  Routes extends BaseRoutes = RouterRoutes<R>
> implements RouterClient<Routes>
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

  protected buildUrl(pathname: string, search?: Record<string, string | string[]>): URL {
    const { baseUrl } = this.config;
    const url = new URL(normalizePathname(baseUrl.pathname + pathname), baseUrl.origin);
    // Reassign to search to avoid unexpected `?`
    // eslint-disable-next-line @silverhand/fp/no-mutation
    url.search = buildSearch(search).toString();

    return url;
  }

  protected buildPathname(path: string, parameters?: Record<string, string>): string {
    return path
      .split('/')
      .map((value) => {
        if (!value.startsWith(':')) {
          return value;
        }

        const key = value.slice(1);
        const parameter = parameters?.[key];

        if (!parameter) {
          throw new TypeError(`URL parameter \`${key}\` not found`);
        }

        return parameter;
      })
      .join('/');
  }

  protected async buildHeaders(
    url: URL,
    method: Lowercase<RequestMethod>,
    body: unknown
  ): Promise<Record<string, string>> {
    const { headers } = this.config;
    const needsJson =
      ![RequestMethod.GET, RequestMethod.OPTIONS, RequestMethod.HEAD]
        .map((value) => value.toLowerCase())
        .includes(method) &&
      body !== undefined &&
      body !== null;
    const unwrappedHeaders = typeof headers === 'function' ? headers(url, method) : headers;

    return {
      host: url.host,
      accept: contentTypes.json,
      ...(needsJson && { 'content-type': contentTypes.json }),
      ...(isPromise(unwrappedHeaders) ? await unwrappedHeaders : unwrappedHeaders),
    };
  }

  protected buildHandler<Method extends Lowercase<RequestMethod>>(method: Method) {
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
        headers: await this.buildHeaders(url, method, body),
        body:
          typeof body === 'string' || body === undefined || body === null
            ? body
            : JSON.stringify(body),
      });

      if (!response.ok) {
        throw new ResponseError(response);
      }

      // Trust backend since it has been guarded
      // eslint-disable-next-line no-restricted-syntax
      return tryJson(response) as ReturnType<ClientRequestHandler<Routes[Method]>>;
    };

    return handler;
  }
}

export * from './types.js';
