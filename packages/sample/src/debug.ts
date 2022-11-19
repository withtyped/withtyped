import createServer from '@withtyped/server';
import { createComposer } from '@withtyped/server/lib/preset';
import Router from '@withtyped/server/lib/router';
import { z } from 'zod';

import { zodTypeToParameters, zodTypeToSwagger } from './openapi.js';

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
  .post(
    '/ok/:sad/asd',
    {
      query: z.object({ foo: z.string(), bar: z.number().optional() }),
      body: z.object({
        key1: z.string(),
        key2: z.object({ foo: z.number(), bar: z.boolean().optional() }),
      }),
      response: z.object({ sad: z.string(), foo: z.number() }),
    },
    async (context, next) => {
      return next({
        ...context,
        json: { sad: context.request.params.sad, foo: context.request.body.key2.foo },
      });
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
  .patch('/123/xc/qw', {}, async (context, next) => {
    return next(context);
  })
  .withOpenApi(zodTypeToParameters, zodTypeToSwagger);

const server = createServer({ composer: createComposer().and(router.routes()) });

server.listen(() => {
  console.log('Listening', 9001);
});
