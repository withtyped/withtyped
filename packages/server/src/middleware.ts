export type BaseContext = {
  status?: number;
  body?: unknown;
};

export type NextFunction<Context extends BaseContext = BaseContext> = (
  context: Readonly<Context>
) => Promise<void>;

export type MiddlewareFunction<
  ContextInput extends BaseContext = BaseContext,
  ContextOutput extends BaseContext = ContextInput
> = (context: ContextInput, next: NextFunction<ContextOutput>) => Promise<void>;

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
