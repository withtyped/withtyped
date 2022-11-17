import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http';

export type BaseContext<Status extends number = number, ResponseBody = unknown> = {
  // `{}` can help us to get the correct type
  // eslint-disable-next-line @typescript-eslint/ban-types
  request?: {};
  status?: Status;
  json?: ResponseBody;
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
