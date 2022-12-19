import { createQueryClient } from '@withtyped/postgres';
import createServer from '@withtyped/server';
import { createComposer } from '@withtyped/server/lib/preset.js';

import { router } from './routers.js';

const queryClient = createQueryClient();

export const server = createServer({
  queryClients: [queryClient],
  composer: createComposer().and(router.routes()),
  port: 9002,
});
