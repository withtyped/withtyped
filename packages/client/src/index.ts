import type { Router, BaseRoutes, GuardedPayload } from '@withtyped/server';

import type { RouterClient, RouterRoutes, RequestMethod, ClientRequestHandler } from './types.js';

export type ClientPayload = {
  params?: Record<string, string>;
  search?: Record<string, string | string[]>;
  body?: unknown;
};

const buildSearchString = (record?: Record<string, string | string[]>) =>
  record
    ? '?' +
      Object.entries(record)
        .flatMap(([key, value]) =>
          Array.isArray(value) ? value.map((value) => `${key}=${value}`) : `${key}=${value}`
        )
        .join('&')
    : '';

const tryJson = async (response: Response) => {
  try {
    // It defines as any, and we already guarded in server :-)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await response.json();
  } catch {}
};

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

  constructor(public readonly baseUrl: string) {}

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
      const requestPath = path
        .split('/')
        .map((value) => {
          if (!value.startsWith(':')) {
            return value;
          }

          const key = value.slice(1);
          const parameter = params?.[key];

          if (!parameter) {
            throw new Error(`URL parameter ${key} not found`);
          }

          return parameter;
        })
        .join('/');

      console.log(method.toUpperCase(), this.baseUrl + requestPath + buildSearchString(search));

      const response = await fetch(this.baseUrl + requestPath + buildSearchString(search), {
        method,
        headers: {
          host: new URL(this.baseUrl).host,
        },
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
