import sinon from 'sinon';

import QueryClient from './client.js';
import type { QueryResult } from './index.js';
import type { Sql } from './utils.js';

export class TestQueryClient extends QueryClient {
  connect = sinon.stub().resolves();
  end = sinon.stub().resolves();

  async query(sql: Sql<unknown, unknown>): Promise<QueryResult<Record<string, unknown>>> {
    throw new Error('Method not implemented.');
  }
}
