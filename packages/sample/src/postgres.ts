import { PostgresModelClient } from '@withtyped/postgres';
import createServer, { ModelRouter, Model } from '@withtyped/server';
import { createComposer } from '@withtyped/server/lib/preset.js';
import { z } from 'zod';

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
