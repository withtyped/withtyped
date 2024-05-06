import { describe, it } from 'node:test';

import { expectTypeOf } from 'expect-type';
import { z } from 'zod';

import { type RequestContext } from '../index.js';
import { type MiddlewareFunction } from '../middleware.js';

import Router, { type PathGuard, type RouterRoutes } from './index.js';

const mid1: MiddlewareFunction<RequestContext, RequestContext & { foo: string }> = async (
  context,
  next
) => {
  return next({ ...context, foo: 'bar' });
};

void describe('router types', () => {
  void it('should be able to infer types for a complex router', () => {
    const subRouter = new Router<
      RequestContext & { foo: string },
      RequestContext & { foo: string }
    >().get(
      '/bar',
      { response: z.object({ storeIds: z.string().array() }) },
      async (context, next) => {
        return next({ ...context, json: { storeIds: [] } });
      }
    );

    const router = new Router<RequestContext, RequestContext & { foo: string }>()
      .use(mid1)
      .get(
        '/foo',
        { response: z.object({ bookIds: z.string().array() }) },
        async (context, next) => {
          return next({ ...context, json: { bookIds: [] } });
        }
      )
      .pack(subRouter);

    type Routes = RouterRoutes<typeof router>;

    // Type tests, should report compile errors if the types are not inferred correctly
    expectTypeOf<Routes['get']['/foo']>().toEqualTypeOf<
      PathGuard<'/foo', unknown, unknown, { bookIds: string[] }>
    >();
    expectTypeOf<Routes['get']['/bar']>().toEqualTypeOf<
      PathGuard<'/bar', unknown, unknown, { storeIds: string[] }>
    >();
  });

  void it('should be able to `.pack()` another router with "lower" context types', () => {
    const subRouter = new Router<RequestContext, RequestContext>().get(
      '/bar',
      { response: z.object({ storeIds: z.string().array() }) },
      async (context, next) => {
        return next({ ...context, json: { storeIds: [] } });
      }
    );

    const router = new Router<RequestContext, RequestContext & { foo: string }>()
      .use(mid1)
      .get(
        '/foo',
        { response: z.object({ bookIds: z.string().array() }) },
        async (context, next) => {
          return next({ ...context, json: { bookIds: [] } });
        }
      )
      .pack(subRouter);

    type Routes = RouterRoutes<typeof router>;

    // Type tests, should report compile errors if the types are not inferred correctly
    expectTypeOf<Routes['get']['/foo']>().toEqualTypeOf<
      PathGuard<'/foo', unknown, unknown, { bookIds: string[] }>
    >();
    expectTypeOf<Routes['get']['/bar']>().toEqualTypeOf<
      PathGuard<'/bar', unknown, unknown, { storeIds: string[] }>
    >();
  });

  void it('should forbid to `.pack()` another router with incompatible context types', () => {
    const subRouter = new Router<
      RequestContext & { foo: number },
      RequestContext & { foo: number }
    >().get(
      '/bar',
      { response: z.object({ storeIds: z.string().array() }) },
      async (context, next) => {
        return next({ ...context, json: { storeIds: [] } });
      }
    );

    const router = new Router<RequestContext, RequestContext & { foo: string }>()
      .use(mid1)
      .get(
        '/foo',
        { response: z.object({ bookIds: z.string().array() }) },
        async (context, next) => {
          return next({ ...context, json: { bookIds: [] } });
        }
      );

    // @ts-expect-error
    router.pack(subRouter);
  });
});
