import Client from '@withtyped/client';

import type { router } from './debug.js';

const client = new Client<typeof router>('http://localhost:9001');

const response = await client.get('/ok/:sad/asd', {
  query: { foo: '123' },
  params: { sad: 'happy' },
});

console.log('response', response);
