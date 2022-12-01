import createServer from '@withtyped/server';
import ModelRouter from '@withtyped/server/lib/model-router/index.js';
import Model from '@withtyped/server/lib/model/index.js';
import { createComposer } from '@withtyped/server/lib/preset.js';
import { z } from 'zod';

import PostgresModelClient from './client.js';

const Book = Model.create(
  /* Sql */ `
  create table books (
    id varchar(128) not null,
    name varchar(128) not null,
    authors jsonb not null default '[]',
    price decimal not null default 99.99,
    year int,
    created_at timestamptz not null default(now()),
    constraint primary key id
  );
`
).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

const modelClient = new PostgresModelClient(Book, { database: 'withtyped' });
const modelRouter = new ModelRouter(modelClient, '/books').withCrud();

const server = createServer({
  composer: createComposer().and(modelRouter.routes()),
});

await modelClient.connect();

server.listen(() => {
  console.log('Listening', 9001);
});
