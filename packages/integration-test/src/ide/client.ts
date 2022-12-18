import Client from '@withtyped/client';

import type { router } from './routers.js';

export const client = new Client<typeof router>('http://localhost:9002');
