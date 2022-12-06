import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http';

export type BaseContext = {
  /** A dictionary to put request info. Use `withRequest()` and `withBody()` to set it automatically. */
  request?: Record<string, unknown>;
  /** The response status number. Default to 404. */
  status?: number;
  /** The response json object. */
  json?: unknown;
  /** The response (outgoing) headers */
  headers?: OutgoingHttpHeaders;
};

export type NextFunction<Context extends BaseContext = BaseContext> = (
  context: Readonly<Context>
) => Promise<void>;

export type HttpContext = {
  request: IncomingMessage;
  response: ServerResponse;
};

export type MiddlewareFunction<
  InputContext extends BaseContext = BaseContext,
  OutputContext extends BaseContext = InputContext
> = (context: InputContext, next: NextFunction<OutputContext>, http: HttpContext) => Promise<void>;

export type GeneralMiddlewareFunction = <
  InputContext extends BaseContext = BaseContext,
  OutputContext extends BaseContext = InputContext
>(
  context: InputContext,
  next: NextFunction<OutputContext>,
  http: HttpContext
) => Promise<void>;

export type ExtractInputContext<Middleware> = Middleware extends MiddlewareFunction<
  infer Input,
  BaseContext
>
  ? Input
  : never;

export type ExtractOutputContext<Middleware> = Middleware extends MiddlewareFunction<
  BaseContext,
  infer Output
>
  ? Output
  : never;
