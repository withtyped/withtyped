import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';

import Model from '@withtyped/server/model';
import sinon from 'sinon';

import PostgresInitializer from './database-initializer.js';
import PostgresQueryClient, { PostgresTransaction } from './query-client.js';
import { PostgreSql } from './sql.js';

class FakeTransaction extends PostgresTransaction {
  start = sinon.stub();
  end = sinon.stub();
  query = sinon.stub();
  tryQuery = sinon.stub();
}

class FakeQueryClient extends PostgresQueryClient {
  config = { database: 'withtyped' };
  connect = sinon.stub();
  end = sinon.stub();
  transaction = sinon.stub();
}

void describe('PostgresInitializer', () => {
  before(() => {
    sinon.stub(PostgresQueryClient.prototype);
  });

  after(() => {
    sinon.restore();
  });

  void it('should throw when no database specified in config', async () => {
    const queryClient = new FakeQueryClient();
    // eslint-disable-next-line @silverhand/fp/no-mutation
    queryClient.config = { database: '' };

    assert.throws(
      () => new PostgresInitializer([], queryClient),
      new Error('No database specified in config')
    );
  });

  void it('should be able to create the target database when it does not exist', async () => {
    // @ts-expect-error Stubbed
    const transaction = new FakeTransaction();
    const queryClient = new FakeQueryClient();
    queryClient.transaction.returns(transaction);

    const initializer = new PostgresInitializer([], queryClient);

    queryClient.connect.onFirstCall().callsFake(() => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw { code: '3D000' };
    });
    await initializer.initialize();
    assert.ok(queryClient.connect.calledTwice);

    queryClient.connect.reset();
    await initializer.initialize();
    assert.ok(queryClient.connect.calledOnce);
  });

  void it('should throw when other error occurred during init', async () => {
    const queryClient = new FakeQueryClient();
    const initializer = new PostgresInitializer([], queryClient);

    queryClient.connect.onFirstCall().callsFake(() => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw { code: '3D001' };
    });
    await assert.rejects(initializer.initialize(), { code: '3D001' });
  });

  void it('should be able to destroy the target database', async () => {
    const queryClient = new FakeQueryClient();
    const initializer = new PostgresInitializer([], queryClient);

    await initializer.destroy();

    assert.ok(queryClient.end.calledOnce);
  });

  void it('should be able to initialize tables with the given raw sql and schema', async () => {
    // @ts-expect-error Stubbed
    const transaction = new FakeTransaction();
    const queryClient = new FakeQueryClient();
    queryClient.transaction.returns(transaction);

    const model1 = Model.create(`create table model1 ();`);
    const model2 = Model.create(`create table model2 ();`);
    const initializer = new PostgresInitializer([model1, model2], queryClient, 'foo');

    assert.deepStrictEqual(initializer.tableSqlStrings(), [model1.raw, model2.raw]);

    await initializer.initialize();
    assert.ok(queryClient.connect.calledOnce);

    const { firstCall, secondCall, args } = transaction.query;

    assert.ok(firstCall.firstArg instanceof PostgreSql);
    assert.deepStrictEqual(firstCall.firstArg.composed.raw, 'create schema if not exists "foo";');

    assert.ok(secondCall.firstArg instanceof PostgreSql);
    assert.deepStrictEqual(secondCall.firstArg.composed.raw, 'set search_path to "foo";');

    assert.ok(args.every((args) => args[0] instanceof PostgreSql));

    sinon.restore();
  });
});
