import http, { IncomingMessage } from 'node:http';

const readRequest = async (request: http.IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    const body: Uint8Array[] = [];
    // eslint-disable-next-line @silverhand/fp/no-mutating-methods
    const pushToBody = (chunk: Uint8Array) => body.push(chunk);

    request
      .on('data', pushToBody)
      .once('end', () => {
        request.removeListener('data', pushToBody);
        resolve(Buffer.concat(body).toString());
      })
      .once('error', (error) => {
        request.removeListener('data', pushToBody);
        reject(error);
      });
  });

type RequestHandler = (body: string, request: http.IncomingMessage) => void | Promise<void>;

const createRequestListener =
  (handler?: RequestHandler): http.RequestListener =>
  async (request, response) => {
    if (request.method !== 'POST') {
      response.writeHead(405).end();

      return;
    }

    const string = await readRequest(request);

    await handler?.(string, request);

    response.writeHead(204).end();
  };

export type CreateServer = {
  port?: number;
  handler?: RequestHandler;
};

const createServerDefault: CreateServer = { port: 9001 };

export default function createServer({
  port = createServerDefault.port,
  handler,
}: CreateServer = createServerDefault) {
  const server = http.createServer(createRequestListener(handler)).on('listening', () => {
    console.log('Server is listening port', port);
  });

  return {
    server,
    listen: () => {
      server.listen(port);
    },
  };
}

createServer().listen();
