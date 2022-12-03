import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ModelClientError } from './errors.js';

describe('ModelClientError', () => {
  it('should not explode', () => {
    assert.strictEqual(
      new ModelClientError('entity_not_found').message,
      'ModelClient error occurred'
    );
  });
});
