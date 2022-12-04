import assert from 'node:assert';
import EventEmitter from 'node:events';
import { describe, it } from 'node:test';

import sinon from 'sinon';
import request from 'supertest';

import createServer, { compose, RequestError } from './index.js';
import { TestQueryClient } from './query/client.test.js';

describe('createServer()', () => {
  it('should not explode', () => {
    assert.ok(createServer());
  });

  it('should be able to run a composer', async () => {
    const composer = sinon.spy(compose());
    // @ts-expect-error for testing
    const { server } = createServer({ composer, logLevel: 'none' });
    sinon.stub(server, 'listen');

    await request(server).get('/');
    assert.ok(composer.calledOnce && composer.calledWith({}));
  });

  it('should be able to catch error', async () => {
    const composer = sinon.spy(
      compose(() => {
        throw new Error('composer error');
      })
    );
    // @ts-expect-error for testing
    const { server } = createServer({ composer, logLevel: 'none' });
    sinon.stub(server, 'listen');

    await request(server).get('/').expect(500);
    assert.ok(composer.calledOnce && composer.calledWith({}));
  });

  it('should be able to parse RequestError', async () => {
    const composer = sinon.spy(
      compose(() => {
        throw new RequestError('composer error', 400);
      })
    );
    // @ts-expect-error for testing
    const { server } = createServer({ composer, logLevel: 'none' });
    sinon.stub(server, 'listen');

    await request(server).get('/').expect(400, { message: 'composer error' });
    assert.ok(composer.calledOnce && composer.calledWith({}));
  });

  it('should be able to call listener callback', async () => {
    const listener = sinon.fake();
    const { server, listen } = createServer({ port: 3001 });
    const serverListen = sinon.stub(server, 'listen');

    await listen(listener);
    server.emit('listening');

    assert.ok(listener.calledOnceWithExactly(3001));
    assert.ok(serverListen.calledOnceWithExactly(3001));
  });

  it('should be able to respond signal', async () => {
    /* eslint-disable @silverhand/fp/no-mutation, @silverhand/fp/no-mutating-assign, no-global-assign */
    const fakeProcess = Object.assign(new EventEmitter(), { exit: sinon.stub() });
    const originalProcess = process;

    // @ts-expect-error for testing
    process = fakeProcess;

    const queryClients = [new TestQueryClient(), new TestQueryClient()];
    const { server, listen } = createServer({ queryClients });
    const serverListen = sinon.stub(server, 'listen');

    await listen();
    // eslint-disable-next-line unicorn/no-useless-undefined
    serverListen.calledOnceWithExactly(undefined);

    for (const client of queryClients) {
      client.connect.calledOnceWithExactly();
    }

    fakeProcess.emit('SIGINT');
    fakeProcess.exit.calledOnceWithExactly(0);

    fakeProcess.emit('SIGQUIT');
    fakeProcess.emit('SIGTERM');
    fakeProcess.exit.calledOnceWithExactly(0);

    for (const client of queryClients) {
      client.end.calledOnceWithExactly();
    }

    process = originalProcess;
    /* eslint-enable @silverhand/fp/no-mutation, @silverhand/fp/no-mutating-assign, no-global-assign */
  });
});
