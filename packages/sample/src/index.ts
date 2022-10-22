import createServer from '@withtyped/server';
import { nanoid } from 'nanoid';
import { createPool, sql } from 'slonik';

const pool = await createPool(process.env.DB_URL ?? 'postgresql://localhost/sample');

createServer({
  handler: async (body, request) => {
    console.log('Received', body);
    await pool.query(sql`
      insert into forms (id, remote_address, headers, data)
      values (${nanoid()}, ${request.socket.remoteAddress ?? null}, ${sql.jsonb(
      request.rawHeaders
    )}, ${sql.jsonb(JSON.parse(body))})
    `);
  },
}).listen();
