import type { RequestMethod } from '../middleware/with-request.js';
import type { RouterClient, RouterRoutes } from './client-types.js';
import type Router from './index.js';
import type { BaseRoutes, GuardedPayload, GuardedResponse } from './types.js';

export type ClientPayload = {
  params?: Record<string, string>;
  query?: Record<string, string | string[]>;
  body?: unknown;
};

const buildQueryString = (record?: Record<string, string | string[]>) =>
  record
    ? '?' +
      Object.entries(record)
        .flatMap(([key, value]) =>
          Array.isArray(value) ? value.map((value) => `${key}=${value}`) : `${key}=${value}`
        )
        .join('&')
    : '';

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

    return async <T extends keyof MethodRoutes>(
      path: T,
      payload: GuardedPayload<MethodRoutes[T]>
    ) => {
      if (typeof path !== 'string') {
        throw new TypeError('Path is not string');
      }

      // We treat payload general and use code to make it works as expected
      // Type inference will always fall into the empty object result
      // eslint-disable-next-line no-restricted-syntax
      const { params, query, body } = payload as ClientPayload;
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

      console.log(this.baseUrl + requestPath + buildQueryString(query));

      const response = await fetch(this.baseUrl + requestPath + buildQueryString(query), {
        method,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Response status ${response.status}`);
      }

      // eslint-disable-next-line no-restricted-syntax
      return response.json() as Promise<GuardedResponse<MethodRoutes[T]>>;
    };
  }
}
