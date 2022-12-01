import assert from 'node:assert';
import { describe, it } from 'node:test';

import { noop } from '@withtyped/shared';

import Route from './route/index.js';
import { matchRoute } from './utils.js';

const base = 'http://fake';

describe('matchRoute()', () => {
  it('should match proper routes', () => {
    const route = new Route('/foo', '/:bar/:baz', {}, noop);

    assert.strictEqual(matchRoute(route, new URL('/foo/123/456', base)), true);
    assert.strictEqual(matchRoute(route, new URL('/foo/ab^%&c/b!az', base)), true);
    assert.strictEqual(matchRoute(route, new URL('/foo/:123/ba_ z', base)), true);
  });

  it('should not match routes', () => {
    const route = new Route('/foo', '/:bar/:baz', {}, noop);

    assert.strictEqual(matchRoute(route, new URL('/foo/123', base)), false);
    assert.strictEqual(matchRoute(route, new URL('/foo1/f/f', base)), false);
    assert.strictEqual(matchRoute(route, new URL('/:foo/f/f', base)), false);
  });

  it('should match proper encodable routes', () => {
    const route = new Route('', '/a%b^%&c/:bar/b!az', {}, noop);

    assert.strictEqual(matchRoute(route, new URL('/a%25b^%25&c/123/b!az', base)), true);
    assert.strictEqual(matchRoute(route, new URL('/a%25b%5E%25&c/abc/b!az', base)), true);
    assert.strictEqual(matchRoute(route, new URL('/a%25b^%25&c/:123/b!az', base)), true);
  });

  it('should not match encodable routes', () => {
    const route = new Route('', '/foo^ %4/:bar/baz', {}, noop);

    assert.strictEqual(matchRoute(route, new URL('/foo^ %4/bar/baz', base)), false);
    assert.strictEqual(matchRoute(route, new URL('/foo^ %254/f/:baz', base)), false);
    assert.strictEqual(matchRoute(route, new URL('/foo^ %254/bar', base)), false);
  });
});
