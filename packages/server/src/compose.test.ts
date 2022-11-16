import assert from 'node:assert';

import { describe, it } from 'node:test';

import compose, { ComposeError } from './compose.js';
import type { BaseContext, MiddlewareFunction } from './middleware.js';

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

describe('compose()', () => {
  it('should compose two middleware functions and return a new middleware function', async () => {
    const baseContext: Readonly<BaseContext> = Object.freeze({ status: 200, body: { foo: 'bar' } });
    await compose(mid1).and(mid2)({ ...baseContext, c1: '256' }, async (context) => {
      assert.deepEqual(context, { ...baseContext, c2: 256, c3: 512 });
    });
  });

  it('should return a valid middleware function', async () => {
    await compose(compose(mid1).and(mid2))({ c1: '128' }, async (context) => {
      assert.deepEqual(context, { c2: 128, c3: 256 });
    });
  });

  it('should be able to chain', async () => {
    const composed = compose(mid1).and(mid2).and(mid3);

    await composed({ c1: '128' }, async (context) => {
      await composed(context, async ({ c1 }) => {
        assert.equal(c1, '512');
      });
    });
  });

  it('should disallow to call same next() twice', async () => {
    await assert.rejects(
      compose(midTwiceNext).and(mid2)({ c1: '128' }, async () => {
        // Let it go
      }),
      new ComposeError('next_call_twice')
    );
  });
});
