import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ModelClientError } from './errors.js';

void describe('ModelClientError', () => {
  void it('should not explode', () => {
    assert.strictEqual(
      new ModelClientError('entity_not_found').message,
      'ModelClientError occurred'
    );
  });
});
