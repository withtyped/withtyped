import assert from 'node:assert';

import { describe, it } from 'node:test';

import { noop } from '../utils.js';
import type { RouteHandler } from './types.js';
import { matchRoute } from './utils.js';

describe('matchRoute()', () => {
  it('should match proper routes', () => {
    const handler: RouteHandler = {
      path: '/foo/:bar/:baz',
      run: noop,
    };
    const base = 'http://fake';

    assert.strictEqual(matchRoute(handler, new URL('/foo/123/456', base)), true);
    assert.strictEqual(matchRoute(handler, new URL('/foo/ab^%&c/b!az', base)), true);
    assert.strictEqual(matchRoute(handler, new URL('/foo/:123/ba_ z', base)), true);
  });

  it('should not match routes', () => {
    const handler: RouteHandler = {
      path: '/foo/:bar/:baz',
      run: noop,
    };
    const base = 'http://fake';

    assert.strictEqual(matchRoute(handler, new URL('/foo/123', base)), false);
    assert.strictEqual(matchRoute(handler, new URL('/foo1/f/f', base)), false);
    assert.strictEqual(matchRoute(handler, new URL('/:foo/f/f', base)), false);
  });

  it('should match proper encodable routes', () => {
    const handler: RouteHandler = {
      path: '/a%b^%&c/:bar/b!az',
      run: noop,
    };
    const base = 'http://fake';

    assert.strictEqual(matchRoute(handler, new URL('/a%25b^%25&c/123/b!az', base)), true);
    assert.strictEqual(matchRoute(handler, new URL('/a%25b%5E%25&c/abc/b!az', base)), true);
    assert.strictEqual(matchRoute(handler, new URL('/a%25b^%25&c/:123/b!az', base)), true);
  });

  it('should not match encodable routes', () => {
    const handler: RouteHandler = {
      path: '/foo^ %4/:bar/baz',
      run: noop,
    };
    const base = 'http://fake';

    assert.strictEqual(matchRoute(handler, new URL('/foo^ %4/bar/baz', base)), false);
    assert.strictEqual(matchRoute(handler, new URL('/foo^ %254/f/:baz', base)), false);
    assert.strictEqual(matchRoute(handler, new URL('/foo^ %254/bar', base)), false);
  });
});
