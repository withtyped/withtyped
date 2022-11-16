import type {
  BaseContext,
  ExtractContextInput,
  MiddlewareFunction,
  NextFunction,
} from './middleware.js';

export type ComposerProperties<
  MiddlewareFunctions extends unknown[],
  ContextInput extends BaseContext,
  ContextOutput extends BaseContext
> = {
  functions: Readonly<MiddlewareFunctions>;
  and: <Context extends BaseContext>(
    middleware: MiddlewareFunction<ContextOutput, Context>
  ) => Composer<
    [...MiddlewareFunctions, MiddlewareFunction<ContextOutput, Context>],
    ContextInput,
    Context
  >;
};

export type Composer<
  MiddlewareFunctions extends unknown[],
  ContextInput extends BaseContext,
  ContextOutput extends BaseContext
> = MiddlewareFunction<ContextInput, ContextOutput> &
  ComposerProperties<MiddlewareFunctions, ContextInput, ContextOutput>;

export class ComposeError extends Error {
  constructor(public type: 'next_call_twice') {
    super('The sample next() function is going to call twice.');
  }
}

const buildNext = (
  [first, ...rest]: readonly MiddlewareFunction[],
  next: NextFunction
): NextFunction => {
  if (!first) {
    return next;
  }

  // Business need
  // eslint-disable-next-line @silverhand/fp/no-let
  let called = false;

  return async (context: ExtractContextInput<typeof first>) => {
    if (called) {
      throw new ComposeError('next_call_twice');
    }
    // eslint-disable-next-line @silverhand/fp/no-mutation
    called = true;

    return first(context, buildNext(rest, next));
  };
};

/**
 * INTERNAL. Should not use it directly since it don't check any type for the initial functions,
 * due to the limit of TypeScript or my coding skill.
 *
 * @param functions An array of (supposed to be) middleware functions.
 * @returns A composer with the given functions.
 */
const createComposer = function <
  T extends unknown[],
  InputContext extends BaseContext,
  OutputContext extends BaseContext
>(functions: Readonly<T>): Composer<T, InputContext, OutputContext> {
  /**
   * TypeScript won't derive the same type after spreading an array.
   * It'll be great to figure out the root cause, but not worthy to be a blocker.
   */
  // eslint-disable-next-line no-restricted-syntax
  const _functions = Object.freeze([...functions]) as Readonly<T>;

  const composer: Composer<T, InputContext, OutputContext> = Object.assign<
    MiddlewareFunction<InputContext, OutputContext>,
    ComposerProperties<T, InputContext, OutputContext>
  >(
    async function (context, next) {
      /**
       * `buildNext()` doesn't care about the context type,
       * and it's also hard to derive the strict context with a generic array type.
       * Thus it's OK to use `as` I think.
       */
      // eslint-disable-next-line no-restricted-syntax
      return buildNext(_functions as Readonly<MiddlewareFunction[]>, next as NextFunction)(context);
    },
    {
      get functions() {
        return _functions;
      },
      and<Context extends BaseContext>(middleware: MiddlewareFunction<OutputContext, Context>) {
        return createComposer<[...T, typeof middleware], InputContext, Context>(
          Object.freeze([..._functions, middleware] as const)
        );
      },
    }
  );

  return composer;
};

/**
 * Create a chainable composer with the given middleware function.
 * Call `.and()` of the composer to chain another middleware function.
 *
 * Usage:
 * ```ts
 * compose(fn1).and(fn2).and(fn3)
 * ```
 *
 * Each composer itself is a middleware function object,
 * i.e. it has the same call signature as a normal middleware function.
 *
 * @param middleware The first middleware function to compose.
 * @returns A composer.
 */
const compose = <InputContext extends BaseContext, OutputContext extends BaseContext>(
  middleware: MiddlewareFunction<InputContext, OutputContext>
) =>
  createComposer<[MiddlewareFunction<InputContext, OutputContext>], InputContext, OutputContext>([
    middleware,
  ]);

export default compose;
