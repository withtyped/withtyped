import type {
  RequestMethod,
  Router,
  BaseRoutes,
  GuardedPayload,
  GuardedResponse,
} from '@withtyped/server';

export type RouterRoutes<RouterInstance extends Router> = RouterInstance extends Router<
  infer Routes
>
  ? Routes
  : never;

type EmptyPayloadRoutes<MethodRoutes> = {
  [K in keyof MethodRoutes]: keyof GuardedPayload<MethodRoutes[K]> extends never ? K : never;
}[keyof MethodRoutes];

export type ClientRequestHandler<MethodRoutes> = {
  <T extends EmptyPayloadRoutes<MethodRoutes>>(path: T): Promise<GuardedResponse<MethodRoutes[T]>>;
  <T extends Exclude<keyof MethodRoutes, EmptyPayloadRoutes<MethodRoutes>>>(
    path: T,
    // It's by design. We need to remove the second argument when path has no payload needed.
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    payload: GuardedPayload<MethodRoutes[T]>
  ): Promise<GuardedResponse<MethodRoutes[T]>>;
};

export type RouterClient<Routes extends BaseRoutes> = {
  [key in Lowercase<RequestMethod>]: ClientRequestHandler<Routes[key]>;
};

export { type RequestMethod } from '@withtyped/server/lib/request.js';
