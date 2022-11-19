import createServer from '@withtyped/server';
import compose from '@withtyped/server/lib/compose';
import withBody from '@withtyped/server/lib/middleware/with-body';
import withCors from '@withtyped/server/lib/middleware/with-cors';
import withRequest from '@withtyped/server/lib/middleware/with-request';
import { RequestMethod } from '@withtyped/server/lib/request';
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
    .and(async (context, next) => {
      const {
        request: { body, method, remoteAddress, rawHeaders },
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
        values (${nanoid()}, ${remoteAddress ?? null}, ${sql.jsonb(rawHeaders)}, ${sql.jsonb(
        body ?? {}
      )})
      `);

      return next({ ...context, status: 204 });
    }),
});

server.listen((port) => {
  console.log('Server is listening port', port);
});
