import assert from 'node:assert';

import type { NextFunction } from '../middleware.js';

export const assertContext =
  (expected: unknown): NextFunction =>
  async (context) => {
    assert.deepStrictEqual(context, expected);
  };
