import sinon from 'sinon';

import type { Transaction } from './client.js';
import QueryClient from './client.js';
import type { QueryResult } from './index.js';

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
