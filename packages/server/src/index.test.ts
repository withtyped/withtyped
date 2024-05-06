import assert from 'node:assert';
import EventEmitter from 'node:events';
import { describe, it } from 'node:test';
import { promisify } from 'node:util';

import { trySafe } from '@silverhand/essentials';
import sinon from 'sinon';
import request from 'supertest';

import createServer, { compose, RequestError } from './index.js';
import { TestQueryClient } from './query/client.test.js';

void describe('createServer()', () => {
  void it('should not explode', () => {
    assert.ok(createServer());
  });

  void it('should be able to run a composer', async () => {
    const composer = sinon.spy(compose());
    // @ts-expect-error for testing
    const { server } = createServer({ composer });

    await request(server).get('/');
    assert.ok(composer.calledOnce && composer.calledWith({}));
  });

  void it('should be able to catch error', async () => {
    const composer = sinon.spy(
      compose(() => {
        throw new Error('composer error');
      })
    );
    // @ts-expect-error for testing
    const { server } = createServer({ composer, logLevel: 'none' });

    await request(server).get('/').expect(500);
    assert.ok(composer.calledOnce && composer.calledWith({}));
  });

  void it('should be able to keep running even if a request is aborted', async () => {
    const composer = sinon.spy(compose());
    // @ts-expect-error for testing
    const { server } = createServer({ composer, logLevel: 'none' });

    // eslint-disable-next-line @silverhand/fp/no-let, @silverhand/fp/no-mutation
    for (let i = 1; i <= 100; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await trySafe(
        request(server)
          .get('/')
          .timeout(Math.random() * 10)
      );
    }

    await request(server).get('/');

    assert.ok(composer.callCount <= 101);
    assert.ok(composer.calledWith({}));
  });

  void it('should be able to parse RequestError', async () => {
    const composer = sinon.spy(
      compose(() => {
        throw new RequestError('composer request error', 400);
      })
    );
    // @ts-expect-error for testing
    const { server } = createServer({ composer, logLevel: 'none' });

    await request(server).get('/').expect(400, { message: 'composer request error' });
    assert.ok(composer.calledOnce && composer.calledWith({}));
  });

  void it('should be able to call listener callback', async () => {
    const listener = sinon.fake();
    const { server, listen } = createServer({ port: 3001 });
    const serverListen = sinon.stub(server, 'listen');

    await listen(listener);
    server.emit('listening');

    assert.ok(listener.calledOnceWithExactly(3001));
    assert.ok(serverListen.calledOnceWithExactly(3001));
  });

  void it('should be able to respond signal', async () => {
    // eslint-disable-next-line unicorn/prefer-event-target
    class FakeEventEmitter extends EventEmitter {
      env = {};
      exit = sinon.stub();
    }

    const fakeProcess = new FakeEventEmitter();
    const stubProcess = sinon.stub(global, 'process').value(fakeProcess);
    console.log('Stubbed process');

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

    fakeProcess.removeAllListeners();

    // Wait promises to be executed
    setTimeout(() => {
      console.log('Restoring process');
      stubProcess.restore();
    }, 0);
  });
});

void describe('request id', () => {
  void it('should generate a request id for each request', async () => {
    const server = createServer({ requestId: { enabled: true }, port: 9001 });
    const requestIds = new Set<string>();
    await server.listen();

    await Promise.all(
      Array.from({ length: 20 }).map(async () => {
        const { headers } = await fetch('http://localhost:9001');
        const requestId = headers.get('x-request-id');

        if (requestId) {
          requestIds.add(requestId);
        }
      })
    );

    assert.strictEqual(requestIds.size, 20);
    await server.close();
  });

  void it('should generate a request id and set it to the custom header', async () => {
    const server = createServer({
      requestId: { enabled: true, headerName: 'Custom-Request-Id' },
      port: 9002,
    });
    await server.listen();

    const { headers } = await fetch('http://localhost:9002');
    const requestId = headers.get('custom-request-id');

    assert.ok(requestId);
    assert.match(requestId, /.+/);

    await server.close();
  });

  void it('should set the request id header even if the response headers are not handled by setting the `headers` property', async () => {
    const server = createServer({
      composer: compose(async (context, next, http) => {
        const promisifyEnd = promisify((callback: () => void) =>
          http.response.end('Hello, world!', callback)
        );
        await promisifyEnd();
        return next(context);
      }),
      requestId: { enabled: true },
      port: 9003,
    });
    await server.listen();

    const response = await fetch('http://localhost:9003');
    const requestId = response.headers.get('x-request-id');

    assert.equal(await response.text(), 'Hello, world!');
    assert.ok(requestId);
    assert.match(requestId, /.+/);

    await server.close();
  });
});
