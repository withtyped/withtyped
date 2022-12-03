import createServer, { RequestMethod, withCors } from '@withtyped/server';
import { createComposer } from '@withtyped/server/lib/preset.js';
import { nanoid } from 'nanoid';
import { createPool, sql } from 'slonik';

const { DB_URL, PORT } = process.env;
const pool = await createPool(DB_URL ?? 'postgresql://localhost/sample');

const server = createServer({
  port: PORT ? Number(PORT) : undefined,
  composer: createComposer()
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

await server.listen((port) => {
  console.log('Server is listening port', port);
});
