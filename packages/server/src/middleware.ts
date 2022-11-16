import type { IncomingMessage, ServerResponse } from 'http';

export type BaseContext<Status extends number = number, ResponseBody = unknown> = {
  status?: Status;
  json?: ResponseBody;
};

export type NextFunction<Context extends BaseContext = BaseContext> = (
  context: Readonly<Context>
) => Promise<void>;

export type HttpContext = {
  request: IncomingMessage;
  response: ServerResponse;
};

export type MiddlewareFunction<
  ContextInput extends BaseContext = BaseContext,
  ContextOutput extends BaseContext = ContextInput
> = (context: ContextInput, next: NextFunction<ContextOutput>, http: HttpContext) => Promise<void>;

export type ExtractContextInput<Middleware> = Middleware extends MiddlewareFunction<
  infer Input,
  BaseContext
>
  ? Input
  : never;

export type ExtractContextOutput<Middleware> = Middleware extends MiddlewareFunction<
  BaseContext,
  infer Output
>
  ? Output
  : never;

export const withStatus =
  <Status extends number>(status: Status): MiddlewareFunction<BaseContext, BaseContext<Status>> =>
  async (context, next) =>
    next({ ...context, status });
