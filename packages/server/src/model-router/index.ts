import RequestError from '../errors/RequestError.js';
import type ModelClient from '../model-client/index.js';
import type Model from '../model/index.js';
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
  constructor(
    public readonly model: Model<Table, CreateType, ModelType>,
    public readonly prefix: Table,
    protected readonly queryRunner: ModelClient<Table, CreateType, ModelType>
  ) {
    super();
  }

  withCreate() {
    const newThis = this.post<'/', unknown, CreateType, ModelType>(
      '/',
      {
        body: createParser((data) => this.model.parse(data, 'create')),
      },
      async (context, next) => {
        return next({ ...context, json: await this.queryRunner.create(context.request.body) });
      }
    );

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<Table, CreateType, ModelType, RouterRoutes<typeof newThis>>;
  }

  withRead() {
    const newThis = this.get<'/', unknown, unknown, { rows: ModelType[]; rowCount: number }>(
      '/',
      {},
      async (context, next) => {
        return next({ ...context, json: await this.queryRunner.readAll() });
      }
    ).get<'/:id', unknown, unknown, ModelType>('/:id', {}, async (context, next) => {
      const { id } = context.request.params;

      return next({ ...context, json: await this.queryRunner.read(id) });
    });

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<Table, CreateType, ModelType, RouterRoutes<typeof newThis>>;
  }

  withUpdate() {
    const newThis = this.patch<'/:id', unknown, Partial<CreateType>, ModelType>(
      '/:id',
      { body: createParser((data) => this.model.parse(data, 'patch')) },
      async (context, next) => {
        const {
          params: { id },
          body,
        } = context.request;

        return next({ ...context, json: await this.queryRunner.update(id, body) });
      }
    ).put<'/:id', unknown, CreateType, ModelType>(
      '/:id',
      { body: createParser((data) => this.model.parse(data, 'create')) },
      async (context, next) => {
        const {
          params: { id },
          body,
        } = context.request;

        return next({ ...context, json: await this.queryRunner.update(id, body) });
      }
    );

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<Table, CreateType, ModelType, RouterRoutes<typeof newThis>>;
  }

  withDelete() {
    const newThis = this.delete<'/:id', unknown, unknown, unknown>(
      '/:id',
      {},
      async (context, next) => {
        const { id } = context.request.params;

        if (!(await this.queryRunner.delete(id))) {
          throw new RequestError(`Resource with ID ${id} does not exist.`, 404);
        }

        return next(context);
      }
    );

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<Table, CreateType, ModelType, RouterRoutes<typeof newThis>>;
  }

  withCrud() {
    return this.withCreate().withRead().withUpdate().withDelete();
  }
}
