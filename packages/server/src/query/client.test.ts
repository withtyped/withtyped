import assert from 'node:assert';
import { describe, it } from 'node:test';

import sinon from 'sinon';

import type { Transaction } from './client.js';
import QueryClient from './client.js';
import type { QueryResult } from './index.js';
import { MultipleRowsFoundError, NoResultError, Sql } from './index.js';

export class TestQueryClient extends QueryClient {
  connect = sinon.stub().resolves();
  end = sinon.stub().resolves();

  async query<T extends Record<string, unknown> = Record<string, unknown>>(): Promise<
    QueryResult<T>
  > {
    throw new Error('Method not implemented.');
  }

  async transaction(): Promise<Transaction> {
    throw new Error('Method not implemented.');
  }
}

export class TestSql extends Sql {
  constructor() {
    super({ raw: [], ...[] }, []);
  }

  public compose(
    rawArray: string[],
    args: unknown[],
    indexInit?: number | undefined
  ): { lastIndex: number } {
    throw new Error('Method not implemented.');
  }

  get composed(): { raw: string; args: unknown[] } {
    throw new Error('Method not implemented.');
  }
}

const createTestClient = () => {
  const testClient = new TestQueryClient();
  const queryStub = sinon.stub(testClient, 'query').resolves({ rows: [], rowCount: 0 });

  return [testClient, queryStub] as const;
};

describe('Queryable', () => {
  it('should properly call underlying function for `.any()`', async () => {
    const [testClient, queryStub] = createTestClient();
    const result = await testClient.any(new TestSql());

    assert.ok(queryStub.calledOnce);
    assert.deepStrictEqual(result, []);
  });

  it('should properly call underlying function for `.many()`', async () => {
    const [testClient, queryStub] = createTestClient();
    const rows = [{ foo: 'bar' }];
    queryStub.onFirstCall().resolves({ rowCount: 1, rows });

    const result = await testClient.many(new TestSql());
    assert.strictEqual(result, rows);

    await assert.rejects(testClient.many(new TestSql()), NoResultError);
    assert.ok(queryStub.calledTwice);
  });

  it('should properly call underlying function for `.maybeOne()`', async () => {
    const [testClient, queryStub] = createTestClient();
    const data = { foo: 'bar' };
    const rows = [data, { bar: 'baz' }];
    queryStub.onFirstCall().resolves({ rowCount: 2, rows });
    queryStub.onSecondCall().resolves({ rowCount: 1, rows: [data] });

    await assert.rejects(testClient.maybeOne(new TestSql()), MultipleRowsFoundError);

    const first = await testClient.maybeOne(new TestSql());
    assert.strictEqual(first, data);

    assert.strictEqual(await testClient.maybeOne(new TestSql()), null);
    assert.ok(queryStub.calledThrice);
  });

  it('should properly call underlying function for `.one()`', async () => {
    const [testClient, queryStub] = createTestClient();
    const data = { foo: 'bar' };
    const rows = [data, { bar: 'baz' }];
    queryStub.onFirstCall().resolves({ rowCount: 2, rows });
    queryStub.onSecondCall().resolves({ rowCount: 1, rows: [data] });

    await assert.rejects(testClient.one(new TestSql()), MultipleRowsFoundError);

    const first = await testClient.one(new TestSql());
    assert.strictEqual(first, data);

    await assert.rejects(testClient.one(new TestSql()), NoResultError);
    assert.ok(queryStub.calledThrice);
  });

  it('should properly call underlying function for `.exists()`', async () => {
    const [testClient, queryStub] = createTestClient();
    const rows = [{ foo: 'bar' }, { bar: 'baz' }];
    queryStub.onFirstCall().resolves({ rowCount: 2, rows });

    assert.strictEqual(await testClient.exists(new TestSql()), true);
    assert.strictEqual(await testClient.exists(new TestSql()), false);

    assert.ok(queryStub.calledTwice);
  });
});
