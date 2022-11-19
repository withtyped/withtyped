import createServer from '@withtyped/server';
import compose from '@withtyped/server/lib/compose.js';
import Router from '@withtyped/server/lib/router/index.js';
import { z } from 'zod';

export const router = new Router()
  .get(
    '/ok/okk',
    {
      query: z.object({ foo: z.string(), bar: z.number().optional() }),
      response: z.object({ success: z.boolean() }),
    },
    async (context, next) => {
      console.log(context.request);

      return next({ ...context, json: { success: true } });
    }
  )
  .get(
    '/ok/1',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/ok/3',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/ok/4',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/ok/5/1/1',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/ok/7/2/2',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/ok/9/32/asd',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/ok/:sad/asd',
    {
      query: z.object({ foo: z.string(), bar: z.number().optional() }),
      response: z.object({ sad: z.string() }),
    },
    async (context, next) => {
      return next({ ...context, json: { sad: context.request.params.sad } });
    }
  )
  .get(
    '/ok/asd/asd',
    {
      query: z.object({ foo: z.string(), bar: z.number().optional() }),
    },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/ok/qq/1',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/ok/11/2',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/ok/qq/1/2/3',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/asd/qwe',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/csad/asd',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/erwc/qwz',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/qwet/qwe/czx/qwe',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  )
  .get(
    '/123/xc/qw',
    { query: z.object({ foo: z.string(), bar: z.number().optional() }) },
    async (context, next) => {
      return next(context);
    }
  );

const server = createServer({ composer: compose(router.routes()) });

server.listen(() => {
  console.log('Listening');
});
