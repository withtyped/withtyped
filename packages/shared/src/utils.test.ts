import assert from 'node:assert';
import { describe, it } from 'node:test';

import sinon from 'sinon';

import { color, log, noop } from './utils.js';

describe('utils', { concurrency: 1 }, () => {
  it('returns nothing from `noop()`', async () => {
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    assert.strictEqual(await noop(), undefined);
  });

  it('should return no color in TTY', () => {
    const stub = sinon.stub(global, 'process').value({ stdout: { isTTY: true } });
    // eslint-disable-next-line no-useless-concat
    assert.strictEqual(color('foo', 'black'), '\u001B[30m' + 'foo' + '\u001B[0m');
    // eslint-disable-next-line no-useless-concat
    assert.strictEqual(color(undefined, 'black'), '\u001B[30m' + 'undefined' + '\u001B[0m');

    stub.value({ stdout: { isTTY: false } });
    assert.strictEqual(color('foo', 'black'), 'foo');
    assert.strictEqual(color(undefined, 'black'), 'undefined');
    stub.restore();
  });

  it('should log as expected', () => {
    if (!process.env.DEBUG) {
      process.env.DEBUG = '';
    }
    const isDebug = sinon.stub(process.env, 'DEBUG').value('1');
    const consoleDebug = sinon.stub(console, 'debug');
    const consoleWarn = sinon.stub(console, 'warn');

    log.debug('foo', 'bar');
    assert.ok(consoleDebug.calledOnce);

    isDebug.value('');
    log.debug('foo', 'bar');
    assert.ok(consoleDebug.calledOnce);
    log.warn('foo');
    assert.ok(consoleWarn.calledOnce);

    isDebug.restore();
    consoleDebug.restore();
    consoleWarn.restore();
  });
});
