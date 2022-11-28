import { z } from 'zod';

import RequestError from '../errors/RequestError.js';
import ModelQueryRunner from '../model-query-runner/index.js';
import Model from '../model/index.js';
import type { BaseRoutes, RouterRoutes } from '../router/index.js';
import Router from '../router/index.js';
import { createParser } from '../utils.js';

// Using `as` in this class since TypeScript has no support on returning generic `this` type
// See https://github.com/microsoft/TypeScript/issues/6223
export default class ModelRouter<
  /* eslint-disable @typescript-eslint/ban-types */
  Table extends string,
  CreateType = {},
  ModelType extends CreateType = CreateType,
  Routes extends BaseRoutes = BaseRoutes
  /* eslint-enable @typescript-eslint/ban-types */
> extends Router<Routes> {
  protected readonly queryRunner = new ModelQueryRunner(this.model);

  constructor(
    public readonly model: Model<Table, CreateType, ModelType>,
    public readonly prefix: Table,
    public readonly idKey: keyof ModelType
  ) {
    super();
  }

  withCreate() {
    const newThis = this.post(
      '/',
      { body: createParser((data) => this.model.parse(data, 'create')) },
      async (context, next) => {
        return next({ ...context, json: await this.queryRunner.create(context.request.body) });
      }
    );

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<Table, CreateType, ModelType, RouterRoutes<typeof newThis>>;
  }

  withRead() {
    const newThis = this.get('/', {}, async (context, next) => {
      return next({ ...context, json: await this.queryRunner.readAll() });
    }).get('/:id', {}, async (context, next) => {
      const { id } = context.request.params;

      return next({ ...context, json: await this.queryRunner.read(this.idKey, id) });
    });

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<Table, CreateType, ModelType, RouterRoutes<typeof newThis>>;
  }

  withUpdate() {
    const newThis = this.patch(
      '/:id',
      { body: createParser((data) => this.model.parse(data, 'patch')) },
      async (context, next) => {
        const {
          params: { id },
          body,
        } = context.request;

        return next({ ...context, json: await this.queryRunner.update(this.idKey, id, body) });
      }
    ).put(
      '/:id',
      { body: createParser((data) => this.model.parse(data, 'create')) },
      async (context, next) => {
        const {
          params: { id },
          body,
        } = context.request;

        return next({ ...context, json: await this.queryRunner.update(this.idKey, id, body) });
      }
    );

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<Table, CreateType, ModelType, RouterRoutes<typeof newThis>>;
  }

  withDelete() {
    const newThis = this.delete('/:id', {}, async (context, next) => {
      const { id } = context.request.params;

      if (!(await this.queryRunner.delete(this.idKey, id))) {
        throw new RequestError(`Resource with ID ${id} does not exist.`, 404);
      }

      return next(context);
    });

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<Table, CreateType, ModelType, RouterRoutes<typeof newThis>>;
  }

  withCrud() {
    return this.withCreate().withRead().withUpdate().withDelete();
  }
}

const forms = Model.create(
  /* Sql */ `
  CREATE table forms ( 
    id VARCHAR(32) not null,
    remote_address varchar(128),
    headers jsonb not null,
    data jsonb,
    num bigint array,
    test decimal not null array default([]),
    created_at timestamptz not null default(now())
  );
`
).extend('data', z.object({ foo: z.string(), bar: z.number() }));

const mr = new ModelRouter(forms, 'forms', 'id');
