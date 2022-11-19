import type { RequestMethod } from '@withtyped/server/lib/request.js';
import type Router from '@withtyped/server/lib/router/index.js';
import type {
  BaseRoutes,
  GuardedPayload,
  GuardedResponse,
} from '@withtyped/server/lib/router/index.js';

export type RouterRoutes<RouterInstance extends Router> = RouterInstance extends Router<
  infer Routes
>
  ? Routes
  : never;

export type RouterClient<Routes extends BaseRoutes> = {
  [key in Lowercase<RequestMethod>]: <T extends keyof Routes[key]>(
    path: T,
    payload: GuardedPayload<Routes[key][T]>
  ) => Promise<GuardedResponse<Routes[key][T]>>;
};

export { type RequestMethod } from '@withtyped/server/lib/request.js';
