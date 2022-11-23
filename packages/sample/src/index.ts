import createServer from '@withtyped/server';
import compose from '@withtyped/server/lib/compose.js';
import withBody from '@withtyped/server/lib/middleware/with-body.js';
import withCors from '@withtyped/server/lib/middleware/with-cors.js';
import withRequest from '@withtyped/server/lib/middleware/with-request.js';
import { RequestMethod } from '@withtyped/server/lib/request.js';
import { nanoid } from 'nanoid';
import { createPool, sql } from 'slonik';

const { DB_URL, PORT } = process.env;
const pool = await createPool(DB_URL ?? 'postgresql://localhost/sample');

const server = createServer({
  port: PORT ? Number(PORT) : undefined,
  composer: compose()
    .and(withRequest())
    .and(withBody())
    .and(withCors())
    .and(async (context, next, { request: { socket, rawHeaders } }) => {
      const {
        request: { body, method },
      } = context;

      if (method === RequestMethod.OPTIONS) {
        return next({ ...context, status: 204 });
      }

      if (method !== RequestMethod.POST) {
        return next({ ...context, status: 405 });
      }

      console.log('Received', body);
      await pool.query(sql`
        insert into forms (id, remote_address, headers, data)
        values (${nanoid()}, ${socket.remoteAddress ?? null}, ${sql.jsonb(rawHeaders)}, ${sql.jsonb(
        body ?? {}
      )})
      `);

      return next({ ...context, status: 204 });
    }),
});

server.listen((port) => {
  console.log('Server is listening port', port);
});
