import Client from '@withtyped/client';

import type { router } from './debug.js';

const client = new Client<typeof router>('http://localhost:9001');

const response = await client.post('/ok/:sad/asd', {
  query: { foo: '123' },
  body: {
    key1: '234',
    key2: {
      foo: 345,
    },
  },
  params: { sad: 'happy' },
});

console.log('response', response);
