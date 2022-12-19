import sinon from 'sinon';

import ModelClient from '../model-client/index.js';
import type Model from '../model/index.js';

export default class TestModelClient<
  Table extends string,
  ModelType extends Record<string, unknown>,
  DefaultKeys extends string = never
> extends ModelClient<Table, ModelType, DefaultKeys> {
  create = sinon
    .stub<[unknown], Promise<ModelType>>()
    // @ts-expect-error for testing
    .returns(Promise.resolve({ action: 'create' }));

  readAll = sinon
    // eslint-disable-next-line @typescript-eslint/ban-types
    .stub<[], Promise<{ rows: ModelType[]; rowCount: number }>>()
    // @ts-expect-error for testing
    .returns(Promise.resolve({ rows: { action: 'readAll' } }));

  read = sinon
    .stub<[keyof ModelType, string], Promise<ModelType>>()
    // @ts-expect-error for testing
    .returns(Promise.resolve({ action: 'read' }));

  update = sinon
    .stub<[keyof ModelType, string, unknown], Promise<ModelType>>()
    // @ts-expect-error for testing
    .returns(Promise.resolve({ action: 'update' }));

  delete = sinon.stub<[keyof ModelType, string], Promise<boolean>>().resolves(true);

  constructor(public readonly model: Model<Table, ModelType, DefaultKeys>) {
    super();
  }
}
