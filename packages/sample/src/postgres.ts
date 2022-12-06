import { createModelRouter, createQueryClient } from '@withtyped/postgres';
import createServer, { createModel } from '@withtyped/server';
import { createComposer } from '@withtyped/server/lib/preset.js';
import { z } from 'zod';

const Book = createModel(/* Sql */ `
  create table books (
    id varchar(128) not null,
    name varchar(128) not null,
    authors jsonb not null default '[]',
    price decimal not null default 99.99,
    year int,
    created_at timestamptz not null default(now()),
    constraint primary key id
  );
`).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

const queryClient = createQueryClient({ database: 'withtyped' });
const modelRouter = createModelRouter(Book, queryClient).withCrud();

const server = createServer({
  queryClients: [queryClient],
  composer: createComposer().and(modelRouter.routes()),
});

await server.listen(() => {
  console.log('Listening', 9001);
});
