create table forms (
  id varchar(32) not null,
  remote_address varchar(128),
  headers jsonb,
  data jsonb,
  created_at timestamptz not null default(now()),
  primary key (id)
);
