import assert from 'node:assert';
import { describe, it } from 'node:test';

import { createComposer } from './preset.js';

describe('presets', () => {
  it('should be able to create preset composer without error', async () => {
    const preset = createComposer();
    assert.ok(Array.isArray(preset.functions));
    assert.ok(typeof preset.and === 'function');
  });
});
