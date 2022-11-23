import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http';

export type BaseContext = {
  request?: Record<string, unknown>;
  status?: number;
  json?: unknown;
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
