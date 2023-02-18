import assert from 'node:assert';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';

import { contentTypes } from '@withtyped/shared';

import { getWriteResponse, writeContextToResponse } from './response.js';
import { createHttpContext, stubResponseWrite } from './test-utils/http.test.js';

describe('writeContextToResponse()', () => {
  it('should write correct value to response based on context', async () => {
    const { response } = createHttpContext();

    await writeContextToResponse(response, { status: 302, headers: { 'content-type': 'foo' } });
    assert.strictEqual(response.statusCode, 302);
    assert.strictEqual(response.getHeader('content-type'), 'foo');
  });

  it('should not set status code when `code` is explicitly ignored by user', async () => {
    const { response } = createHttpContext();

    await writeContextToResponse(response, { status: 'ignore' });
    assert.strictEqual(response.statusCode, 200);
  });

  it('should automatically set content-type header when json is not null', async () => {
    const { response } = createHttpContext();
    const stub = stubResponseWrite(response);

    await writeContextToResponse(response, { json: { foo: 'bar' } });
    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.getHeader('content-type'), contentTypes.json);
    assert.ok(stub.calledOnceWith(JSON.stringify({ foo: 'bar' }), 'utf8'));
  });

  it('should allow content-type to be overwrote by user', async () => {
    const { response } = createHttpContext();
    const stub = stubResponseWrite(response);

    await writeContextToResponse(response, {
      status: 200,
      headers: { 'content-type': 'bar' },
      json: { foo: 123 },
    });
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.getHeader('content-type'), 'bar');
    assert.ok(stub.calledOnceWith(JSON.stringify({ foo: 123 }), 'utf8'));
  });

  it('should be ok when `stream` is set', async () => {
    const { response } = createHttpContext();

    // It is hard to test ServerResponse output with an empty IncomingMessage. Just do the sanity check here.
    assert.ok(writeContextToResponse(response, { stream: Readable.from('foo') }));
  });

  it('should be ok when nothing is set', async () => {
    const { response } = createHttpContext();

    await writeContextToResponse(response, {});
    assert.strictEqual(response.statusCode, 404);
  });
});

describe('getWriteResponse()', () => {
  it('should directly write to response if chunk is buffer or string', async () => {
    const { response } = createHttpContext();
    const stub = stubResponseWrite(response);
    const string = 'abcdefg';
    const buffer = Buffer.from(string);

    const write = getWriteResponse(response);

    await write(buffer);
    // @ts-expect-error compatible with the function overload
    assert.ok(stub.calledOnceWith(buffer));

    stub.resetHistory();
    await write(string);
    assert.ok(stub.calledOnceWith(string, 'utf8'));
  });

  it('should stringify JSON and write to response if chunk is an object', async () => {
    const { response } = createHttpContext();
    const stub = stubResponseWrite(response);
    const write = getWriteResponse(response);
    const object = { foo: '123', bar: 123, baz: [{ foo: 'bar' }, { bar: 'baz' }] };

    await write(object);
    assert.ok(stub.calledOnceWith(JSON.stringify(object), 'utf8'));
  });
});
