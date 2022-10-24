import createServer from '@withtyped/server';
import { nanoid } from 'nanoid';
import { createPool, sql } from 'slonik';

const { DB_URL, PORT } = process.env;
const pool = await createPool(DB_URL ?? 'postgresql://localhost/sample');

createServer({
  port: PORT ? Number(PORT) : undefined,
  handler: async (body, request, response) => {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
      'Access-Control-Max-Age': 2_592_000, // 30 days
    };

    for (const [key, value] of Object.entries(headers)) {
      response.setHeader(key, value);
    }

    if (request.method === 'OPTIONS') {
      return;
    }

    console.log('Received', body);
    await pool.query(sql`
      insert into forms (id, remote_address, headers, data)
      values (${nanoid()}, ${request.socket.remoteAddress ?? null}, ${sql.jsonb(
      request.rawHeaders
    )}, ${sql.jsonb(JSON.parse(body))})
    `);
  },
}).listen();
