/* eslint-disable max-lines */
import { createModel } from '@withtyped/server/model';
import { z } from 'zod';

export const Book1 = createModel(/* Sql */ `
    create table books_1 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book2 = createModel(/* Sql */ `
    create table books_2 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book3 = createModel(/* Sql */ `
    create table books_3 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book4 = createModel(/* Sql */ `
    create table books_4 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book5 = createModel(/* Sql */ `
    create table books_5 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book6 = createModel(/* Sql */ `
    create table books_6 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book7 = createModel(/* Sql */ `
    create table books_7 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book8 = createModel(/* Sql */ `
    create table books_8 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book9 = createModel(/* Sql */ `
    create table books_9 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book10 = createModel(/* Sql */ `
    create table books_10 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book11 = createModel(/* Sql */ `
    create table books_11 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book12 = createModel(/* Sql */ `
    create table books_12 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book13 = createModel(/* Sql */ `
    create table books_13 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book14 = createModel(/* Sql */ `
    create table books_14 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book15 = createModel(/* Sql */ `
    create table books_15 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book16 = createModel(/* Sql */ `
    create table books_16 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book17 = createModel(/* Sql */ `
    create table books_17 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book18 = createModel(/* Sql */ `
    create table books_18 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book19 = createModel(/* Sql */ `
    create table books_19 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book20 = createModel(/* Sql */ `
    create table books_20 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book21 = createModel(/* Sql */ `
    create table books_21 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book22 = createModel(/* Sql */ `
    create table books_22 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book23 = createModel(/* Sql */ `
    create table books_23 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book24 = createModel(/* Sql */ `
    create table books_24 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book25 = createModel(/* Sql */ `
    create table books_25 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book26 = createModel(/* Sql */ `
    create table books_26 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book27 = createModel(/* Sql */ `
    create table books_27 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book28 = createModel(/* Sql */ `
    create table books_28 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book29 = createModel(/* Sql */ `
    create table books_29 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book30 = createModel(/* Sql */ `
    create table books_30 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book31 = createModel(/* Sql */ `
    create table books_31 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book32 = createModel(/* Sql */ `
    create table books_32 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book33 = createModel(/* Sql */ `
    create table books_33 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book34 = createModel(/* Sql */ `
    create table books_34 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book35 = createModel(/* Sql */ `
    create table books_35 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book36 = createModel(/* Sql */ `
    create table books_36 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book37 = createModel(/* Sql */ `
    create table books_37 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book38 = createModel(/* Sql */ `
    create table books_38 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book39 = createModel(/* Sql */ `
    create table books_39 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book40 = createModel(/* Sql */ `
    create table books_40 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book41 = createModel(/* Sql */ `
    create table books_41 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book42 = createModel(/* Sql */ `
    create table books_42 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book43 = createModel(/* Sql */ `
    create table books_43 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book44 = createModel(/* Sql */ `
    create table books_44 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book45 = createModel(/* Sql */ `
    create table books_45 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book46 = createModel(/* Sql */ `
    create table books_46 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book47 = createModel(/* Sql */ `
    create table books_47 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book48 = createModel(/* Sql */ `
    create table books_48 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book49 = createModel(/* Sql */ `
    create table books_49 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());

export const Book50 = createModel(/* Sql */ `
    create table books_50 (
      id varchar(128) not null,
      name varchar(128) not null,
      authors jsonb not null default '[]',
      price decimal not null default 99.99,
      year int,
      created_at timestamptz not null default(now()),
      primary key (id)
    );
  `).extend('authors', z.object({ name: z.string(), email: z.string().optional() }).array());
/* eslint-enable max-lines */
