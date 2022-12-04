import { describe, it } from 'node:test';

import { identifier, PostgresQueryClient, sql } from '@withtyped/postgres';
import { log } from '@withtyped/shared';
import { customAlphabet, urlAlphabet } from 'nanoid';
import { z } from 'zod';

class PostgresInitClient {
  constructor(
    public readonly queryClient: PostgresQueryClient,
    public readonly maintenanceDatabase = 'postgres'
  ) {}

  async initialize() {
    const database = this.queryClient.config?.database;

    if (!database) {
      throw new Error('No database specified in config');
    }

    try {
      await this.queryClient.connect();
    } catch (error: unknown) {
      const result = z.object({ code: z.string() }).safeParse(error);

      // Only proceed when database does not exist error
      // https://www.postgresql.org/docs/14/errcodes-appendix.html
      if (!(result.success && result.data.code === '3D000')) {
        throw error;
      }

      log.warn(`Database ${database} does not exist, trying to create one`);

      const maintenanceClient = this.createMaintenanceClient();
      await maintenanceClient.connect();
      await maintenanceClient.query(sql`
        create database ${identifier(database)}
          with
          encoding = 'UTF8'
          connection_limit = -1;
      `);
      await maintenanceClient.end();
      log.warn(`Database ${database} created`);

      await this.queryClient.connect();
    }
  }

  async destroy() {
    const database = this.queryClient.config?.database;

    if (!database) {
      throw new Error('No database specified in config');
    }

    await this.queryClient.end();
    const maintenanceClient = this.createMaintenanceClient();
    await maintenanceClient.connect();
    await maintenanceClient.query(sql`drop database ${identifier(database)};`);
    await maintenanceClient.end();

    log.warn(`Dropped database ${database}`);
  }

  protected createMaintenanceClient() {
    return new PostgresQueryClient({
      ...this.queryClient.config,
      database: this.maintenanceDatabase,
    });
  }
}

describe('test', () => {
  const database = 'withtyped-' + customAlphabet(urlAlphabet, 8)();
  const queryClient = new PostgresQueryClient({ database });

  it('seed', async () => {
    const initClient = new PostgresInitClient(queryClient);
    await initClient.initialize();
    await initClient.destroy();
  });
});
