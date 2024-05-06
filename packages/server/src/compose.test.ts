import assert from 'node:assert';
import { describe, it } from 'node:test';

import { noop } from '@withtyped/shared';

import compose, { ComposeError } from './compose.js';
import type { BaseContext, MiddlewareFunction } from './middleware.js';
import { createHttpContext } from './test-utils/http.test.js';

type Ctx1 = BaseContext & { c1: string };

type Ctx2 = BaseContext & { c1: string; c2: number };

type Ctx3 = BaseContext & { c2: number; c3: number };

const mockResolve = async () =>
  new Promise((resolve) => {
    setTimeout(resolve, 1);
  });

const mid1: MiddlewareFunction<Ctx1, Ctx2> = async (context, next) =>
  next({ ...context, c2: Number(context.c1) });

const mid2: MiddlewareFunction<Ctx2, Ctx3> = async ({ c1, ...rest }, next) => {
  await mockResolve();

  return next({ ...rest, c3: rest.c2 * 2 });
};

const mid3: MiddlewareFunction<Ctx3, Ctx1> = async ({ c2, c3, ...rest }, next) =>
  next({ ...rest, c1: c3.toString() });

const midTwiceNext: MiddlewareFunction<Ctx1, Ctx2> = async (context, next) => {
  await next({ ...context, c2: Number(context.c1) });
  await next({ ...context, c2: Number(context.c1) });
};

const midError: MiddlewareFunction<Ctx2, Ctx3> = async () => {
  await mockResolve();
  throw new Error('A special error');
};

const httpContext = createHttpContext();

void describe('compose()', () => {
  void it('should allow to create an empty composer', async () => {
    await compose()({}, noop, httpContext);
  });

  void it('should compose two middleware functions and return a new middleware function', async () => {
    const baseContext: Readonly<BaseContext> = Object.freeze({ status: 200, json: { foo: 'bar' } });
    await compose(mid1).and(mid2)(
      { ...baseContext, c1: '256' },
      async (context) => {
        assert.deepStrictEqual(context, { ...baseContext, c2: 256, c3: 512 });
      },
      httpContext
    );
  });

  void it('should return a valid middleware function', async () => {
    await compose(compose(mid1).and(mid2))(
      { c1: '128' },
      async (context) => {
        assert.deepStrictEqual(context, { c2: 128, c3: 256 });
      },
      httpContext
    );
  });

  void it('should be able to chain', async () => {
    const composed = compose(mid1).and(mid2).and(mid3);

    await composed.and(compose(compose())).and(composed)(
      { c1: '128' },
      async ({ c1 }) => {
        assert.strictEqual(c1, '512');
      },
      httpContext
    );
  });

  void it('should throw error originated by middleware', async () => {
    await assert.rejects(
      compose(mid1).and(midError).and(mid3)({ c1: '128' }, noop, httpContext),
      new Error('A special error')
    );
  });

  void it('should disallow to call same next() twice', async () => {
    await assert.rejects(
      compose(midTwiceNext).and(mid2)({ c1: '128' }, noop, httpContext),
      new ComposeError('next_call_twice')
    );
  });
});
