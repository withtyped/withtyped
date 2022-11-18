import type { RequestMethod } from '../middleware/with-request.js';
import type Router from './index.js';
import type { BaseRoutes, GuardedPayload, GuardedResponse } from './types.js';

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
