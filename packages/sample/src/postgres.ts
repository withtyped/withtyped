import { createModel } from '@withtyped/server/model';
import { z } from 'zod';

export const Book = createModel(/* sql */ `
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
