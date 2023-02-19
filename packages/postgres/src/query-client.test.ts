import assert from 'node:assert';
import { describe, it } from 'node:test';

import sinon from 'sinon';

import { createQueryClient, PostgresTransaction } from './query-client.js';
import { sql } from './sql.js';

class FakePoolClient {
  release = sinon.stub();
  query = sinon.stub();
}
class FakePg {
  connect = sinon.stub().resolves(new FakePoolClient());
  end = sinon.stub();
  query = sinon.stub();
}

describe('PostgresQueryClient', () => {
  it('should call the inner instance methods accordingly', async () => {
    const queryClient = createQueryClient();
    const fakePg = new FakePg();
    // @ts-expect-error for testing
    sinon.replace(queryClient, 'pool', fakePg);

    assert.deepStrictEqual(
      [fakePg.connect.notCalled, fakePg.end.notCalled, fakePg.query.notCalled],
      [true, true, true]
    );

    await queryClient.connect();
    assert.ok(fakePg.connect.calledOnce);

    await queryClient.end();
    assert.ok(fakePg.end.calledOnce);

    const query = sql`select * from ${'foo'}`;
    await queryClient.query(query);
    assert.ok(fakePg.query.calledOnceWithExactly('select * from $1', ['foo']));
  });

  it("should not call pool's `.end()` twice", async () => {
    const queryClient = createQueryClient();
    const fakePg = new FakePg();
    // @ts-expect-error for testing
    sinon.replace(queryClient, 'pool', fakePg);

    assert.strictEqual(queryClient.status, 'active');
    await queryClient.end();
    await queryClient.end();
    assert.strictEqual(queryClient.status, 'ended');
    assert.ok(fakePg.end.calledOnceWithExactly());
  });

  it('should be able to create a transaction instance', async () => {
    const queryClient = createQueryClient();
    const fakePg = new FakePg();
    // @ts-expect-error for testing
    sinon.replace(queryClient, 'pool', fakePg);

    await queryClient.transaction();
    assert.ok(fakePg.connect.calledOnceWithExactly());
  });
});

describe('PostgresQueryClient', () => {
  it('should be able to execute queries', async () => {
    const fakeClient = new FakePoolClient();
    // @ts-expect-error for testing
    const transaction = new PostgresTransaction(fakeClient);

    await transaction.start();
    // eslint-disable-next-line unicorn/no-useless-undefined
    assert.ok(fakeClient.query.calledWithExactly('begin', undefined));

    const query = sql`select * from samurai;`;
    const { raw, args } = query.composed;
    await transaction.query(query);
    assert.ok(fakeClient.query.calledWithExactly(raw, args));

    await transaction.end();
    // eslint-disable-next-line unicorn/no-useless-undefined
    assert.ok(fakeClient.query.calledWithExactly('commit', undefined));
    assert.ok(fakeClient.release.calledOnceWithExactly());
  });

  it('should be able to catch error and release client', async () => {
    const fakeClient = new FakePoolClient();
    // @ts-expect-error for testing
    const transaction = new PostgresTransaction(fakeClient);

    await transaction.start();
    // eslint-disable-next-line unicorn/no-useless-undefined
    assert.ok(fakeClient.query.calledWithExactly('begin', undefined));

    const query = sql`select * from samurai;`;
    const error = new Error('Some transaction error.');
    fakeClient.query.onSecondCall().rejects(error);
    await assert.rejects(transaction.query(query), error);

    assert.ok(fakeClient.query.calledWithExactly('rollback'));
    assert.ok(fakeClient.release.calledOnceWithExactly());
  });
});
