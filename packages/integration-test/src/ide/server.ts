import { createQueryClient } from '@withtyped/postgres';
import createServer from '@withtyped/server';

const queryClient = createQueryClient();

export const server = createServer({
  queryClients: [queryClient],
  // TODO: `createModelRouter` has been removed, the IDE stress test should be performed in another way
  // composer: createComposer().and(router.routes()),
  port: 9002,
});
