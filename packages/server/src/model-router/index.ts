import compose from '../compose.js';
import RequestError from '../errors/RequestError.js';
import type { MiddlewareFunction } from '../middleware.js';
import type { RequestContext } from '../middleware/with-request.js';
import type ModelClient from '../model-client/index.js';
import { ModelClientError } from '../model-client/index.js';
import type { IdKeys } from '../model/types.js';
import type { BaseRoutes, NormalizedPrefix, RouterRoutes } from '../router/index.js';
import Router from '../router/index.js';
import { createParser } from '../utils.js';

// Using `as` in this class since TypeScript has no support on returning generic `this` type
// See https://github.com/microsoft/TypeScript/issues/6223
export default class ModelRouter<
  /* eslint-disable @typescript-eslint/ban-types */
  Table extends string,
  CreateType extends Record<string, unknown> = {},
  ModelType extends CreateType = CreateType,
  IdKey extends IdKeys<ModelType> = 'id' extends IdKeys<ModelType> ? 'id' : never,
  Routes extends BaseRoutes = BaseRoutes
  /* eslint-enable @typescript-eslint/ban-types */
> extends Router<Routes, `/${Table}`> {
  public readonly idKey: IdKeys<ModelType>;

  constructor(
    public readonly client: ModelClient<Table, CreateType, ModelType>,
    public readonly prefix: NormalizedPrefix<`/${Table}`>,
    idKey?: IdKey
  ) {
    super(prefix);

    // eslint-disable-next-line no-restricted-syntax
    this.idKey = idKey ?? ('id' as IdKey); // Use `as` here since we'll check validity below

    if (!client.model.isIdKey(this.idKey)) {
      throw new TypeError(
        `No ID key provided while the default key \`${String(
          this.idKey
        )}\` is not a valid ID key in this model.\n` +
          'A valid ID key should have a string or number value in the model.'
      );
    }
  }

  get model() {
    return this.client.model;
  }

  public routes(): MiddlewareFunction<RequestContext, RequestContext> {
    return compose<RequestContext, RequestContext>(async (context, next) => {
      try {
        await next(context);
      } catch (error: unknown) {
        if (error instanceof ModelClientError && error.code === 'entity_not_found') {
          throw new RequestError('Entity not found', 404);
        }

        throw error;
      }
    }).and(super.routes());
  }

  withCreate() {
    const newThis = this.post<'/', unknown, CreateType, ModelType>(
      '/',
      {
        body: createParser((data) => this.model.parse(data, 'create')),
      },
      async (context, next) => {
        return next({ ...context, json: await this.client.create(context.request.body) });
      }
    );

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<
      Table,
      CreateType,
      ModelType,
      IdKey,
      RouterRoutes<typeof newThis>
    >;
  }

  withRead() {
    const newThis = this.get<'/', unknown, unknown, { rows: ModelType[]; rowCount: number }>(
      '/',
      {},
      async (context, next) => {
        return next({ ...context, json: await this.client.readAll() });
      }
    ).get<'/:id', unknown, unknown, ModelType>('/:id', {}, async (context, next) => {
      const { id } = context.request.params;

      return next({ ...context, json: await this.client.read(this.idKey, id) });
    });

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<
      Table,
      CreateType,
      ModelType,
      IdKey,
      RouterRoutes<typeof newThis>
    >;
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

        if (Object.keys(body).length === 0) {
          throw new RequestError('Nothing to update', 400);
        }

        return next({ ...context, json: await this.client.update(this.idKey, id, body) });
      }
    ).put<'/:id', unknown, CreateType, ModelType>(
      '/:id',
      { body: createParser((data) => this.model.parse(data, 'create')) },
      async (context, next) => {
        const {
          params: { id },
          body,
        } = context.request;

        return next({ ...context, json: await this.client.update(this.idKey, id, body) });
      }
    );

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<
      Table,
      CreateType,
      ModelType,
      IdKey,
      RouterRoutes<typeof newThis>
    >;
  }

  withDelete() {
    const newThis = this.delete<'/:id', unknown, unknown, unknown>(
      '/:id',
      {},
      async (context, next) => {
        const { id } = context.request.params;

        if (!(await this.client.delete(this.idKey, id))) {
          throw new RequestError(`Resource with ID ${id} does not exist.`, 404);
        }

        return next(context);
      }
    );

    // eslint-disable-next-line no-restricted-syntax
    return newThis as ModelRouter<
      Table,
      CreateType,
      ModelType,
      IdKey,
      RouterRoutes<typeof newThis>
    >;
  }

  withCrud() {
    return this.withCreate().withRead().withUpdate().withDelete();
  }
}
