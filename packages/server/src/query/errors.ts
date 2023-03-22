import type { Sql } from './utils.js';

export class QueryError<SqlTag extends Sql> extends Error {
  name = 'QueryError';

  constructor(public readonly query: SqlTag) {
    super('An error occurred when running query.');
  }
}

export class NoResultError<SqlTag extends Sql> extends QueryError<SqlTag> {
  name = 'NoResultError';
  message = 'No query result found while it is expected.';

  constructor(public readonly query: SqlTag) {
    super(query);
  }
}

export class MultipleRowsFoundError<SqlTag extends Sql> extends QueryError<SqlTag> {
  name = 'MultipleRowsFoundError';
  message = 'Multiple rows found in query while only one is expected.';

  constructor(public readonly query: SqlTag) {
    super(query);
  }
}
