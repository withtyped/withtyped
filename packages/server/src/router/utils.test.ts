import assert from 'node:assert';

import { describe, it } from 'node:test';
import { z } from 'zod';

import { noop } from '../utils.js';
import type { RouteHandler } from './types.js';
import { guardInput, matchRoute, parsePathParams, searchParamsToObject } from './utils.js';

const base = 'http://fake';

describe('matchRoute()', () => {
  it('should match proper routes', () => {
    const handler: RouteHandler = {
      path: '/foo/:bar/:baz',
      run: noop,
    };

    assert.strictEqual(matchRoute(handler, new URL('/foo/123/456', base)), true);
    assert.strictEqual(matchRoute(handler, new URL('/foo/ab^%&c/b!az', base)), true);
    assert.strictEqual(matchRoute(handler, new URL('/foo/:123/ba_ z', base)), true);
  });

  it('should not match routes', () => {
    const handler: RouteHandler = {
      path: '/foo/:bar/:baz',
      run: noop,
    };

    assert.strictEqual(matchRoute(handler, new URL('/foo/123', base)), false);
    assert.strictEqual(matchRoute(handler, new URL('/foo1/f/f', base)), false);
    assert.strictEqual(matchRoute(handler, new URL('/:foo/f/f', base)), false);
  });

  it('should match proper encodable routes', () => {
    const handler: RouteHandler = {
      path: '/a%b^%&c/:bar/b!az',
      run: noop,
    };

    assert.strictEqual(matchRoute(handler, new URL('/a%25b^%25&c/123/b!az', base)), true);
    assert.strictEqual(matchRoute(handler, new URL('/a%25b%5E%25&c/abc/b!az', base)), true);
    assert.strictEqual(matchRoute(handler, new URL('/a%25b^%25&c/:123/b!az', base)), true);
  });

  it('should not match encodable routes', () => {
    const handler: RouteHandler = {
      path: '/foo^ %4/:bar/baz',
      run: noop,
    };

    assert.strictEqual(matchRoute(handler, new URL('/foo^ %4/bar/baz', base)), false);
    assert.strictEqual(matchRoute(handler, new URL('/foo^ %254/f/:baz', base)), false);
    assert.strictEqual(matchRoute(handler, new URL('/foo^ %254/bar', base)), false);
  });
});

describe('parsePathParams()', () => {
  it('should return an empty object when no path param available', () => {
    assert.deepEqual(parsePathParams('/foo/bar/baz', new URL('/foo/bar/baz', base)), {});
    assert.deepEqual(parsePathParams('/', new URL('/foo/bar/baz', base)), {});
  });

  it('should return proper decoded params', () => {
    assert.deepEqual(parsePathParams('/foo/:bar/:baz', new URL('/foo/bar/baz', base)), {
      bar: 'bar',
      baz: 'baz',
    });
    assert.deepEqual(parsePathParams('/foo/:bar/:baz', new URL('/foo/bar?baz=123', base)), {
      bar: 'bar',
      baz: '',
    });
    assert.deepEqual(parsePathParams('/foo/:bar', new URL('/foo/bar/baz/buh', base)), {
      bar: 'bar',
    });
    assert.deepEqual(parsePathParams('/foo/:bar', new URL('/foo/%20DDD', base)), {
      bar: '%20DDD',
    });
  });
});

describe('searchParamsToObject()', () => {
  it('should return a proper object', () => {
    assert.deepEqual(searchParamsToObject(new URL('/foo?', base).searchParams), {});
    assert.deepEqual(
      searchParamsToObject(new URL('/foo?foo=123&baz=456&foo=123', base).searchParams),
      {
        foo: ['123', '123'],
        baz: '456',
      }
    );
    assert.deepEqual(
      searchParamsToObject(new URLSearchParams('?foo=123&baz=456&foo=a%25b%5E%25%26c&foo=%254')),
      {
        foo: ['123', 'a%b^%&c', '%4'],
        baz: '456',
      }
    );
    assert.deepEqual(
      searchParamsToObject(new URLSearchParams('foo=123&baz=456&foo=a%25b%5E%25&c&&&&c&foo=%254')),
      {
        foo: ['123', 'a%b^%', '%4'],
        baz: '456',
        c: ['', ''],
      }
    );
    assert.deepEqual(searchParamsToObject(new URLSearchParams('?foo=1&bar=2&foo=%5Ea')), {
      foo: ['1', '^a'],
      bar: '2',
    });
  });
});

describe('guardInput()', () => {
  it('should return a proper guarded object', () => {
    assert.deepEqual(guardInput('/', new URL('/', base), {}, {}), {
      params: {},
      search: undefined,
      body: undefined,
    });

    const url = new URL('/bar?foo[]=123&baz=456&foo=a%25b%5E%25%26c&foo=%254', base);
    const body = {
      what: {
        when: 100,
        who: ['123', 'aaa'],
        and: 123,
      },
    };

    assert.deepEqual(
      guardInput('/:foo', url, body, {
        search: z.object({
          'foo[]': z.string(),
          foo: z.string().array(),
          baz: z.string(),
        }),
      }),
      {
        params: {
          foo: 'bar',
        },
        search: {
          'foo[]': '123',
          foo: ['a%b^%&c', '%4'],
          baz: '456',
        },
        body: undefined,
      }
    );
    assert.deepEqual(
      guardInput('/:foo/:bar', url, body, {
        search: z.object({
          foo: z.string().array(),
          baz: z.string().min(3),
        }),
        body: z.object({ what: z.object({ when: z.number(), who: z.string().array().min(2) }) }),
      }),
      {
        params: {
          foo: 'bar',
          bar: '',
        },
        search: {
          foo: ['a%b^%&c', '%4'],
          baz: 456,
        },
        body: {
          what: {
            when: 100,
            who: ['123', 'aaa'],
          },
        },
      }
    );
  });

  it('should throw error when parse failed', () => {
    const url = new URL('/bar?foo=123&baz=456&foo=a%25b%5E%25%26c&foo=%254', base);
    const body = {
      what: {
        when: 100,
        who: ['123'],
        and: 123,
      },
    };

    assert.throws(() =>
      guardInput('/:foo', url, body, {
        body: z.object({ what: z.object({ when: z.number(), who: z.string().array().min(2) }) }),
      })
    );
    assert.throws(() =>
      guardInput('/:foo', url, body, {
        search: z.object({ foo: z.string().optional() }),
        body: z.object({ what: z.object({ when: z.number(), who: z.string().array().min(1) }) }),
      })
    );
  });
});
