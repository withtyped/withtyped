import { DatabaseInitializer } from '@withtyped/server';
import type Model from '@withtyped/server/model';
import { log } from '@withtyped/shared';

import PostgresQueryClient from './query-client.js';
import { identifier, PostgreSql, sql } from './sql.js';

export default class PostgresInitializer extends DatabaseInitializer<PostgresQueryClient> {
  public readonly database: string;

  constructor(
    public readonly models: Array<Model<string, Record<string, unknown>>>,
    public readonly queryClient: PostgresQueryClient,
    public readonly maintenanceDatabase = 'postgres'
  ) {
    super();

    if (!queryClient.config?.database) {
      throw new Error('No database specified in config');
    }

    this.database = queryClient.config.database;
  }

  async initialize(): Promise<void> {
    await this.createDatabaseIfNeeded();

    for (const model of this.models) {
      log.warn(`Creating table ${model.tableName}`);
      // eslint-disable-next-line no-await-in-loop
      await this.queryClient.query(
        new PostgreSql(Object.assign([model.raw], { raw: [model.raw] }), [])
      );
    }

    log.warn('Database initialization completed');
  }

  async destroy(): Promise<void> {
    await this.queryClient.end();
    const maintenanceClient = this.createMaintenanceClient();
    await maintenanceClient.connect();
    await maintenanceClient.query(sql`drop database ${identifier(this.database)};`);
    await maintenanceClient.end();

    log.warn(`Dropped database ${this.database}`);
  }

  tableSqlStrings(): string[] {
    return this.models.map((model) => model.raw);
  }

  protected async createDatabaseIfNeeded() {
    try {
      await this.queryClient.connect();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        // Only proceed when database does not exist error
        // https://www.postgresql.org/docs/14/errcodes-appendix.html
        !(error.code === '3D000')
      ) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw error; // Don't transpile, throw the original error
      }

      log.warn(`Database ${this.database} does not exist, trying to create one`);

      const maintenanceClient = this.createMaintenanceClient();
      await maintenanceClient.connect();
      await maintenanceClient.query(sql`
        create database ${identifier(this.database)}
          with
          encoding = 'UTF8'
          connection_limit = -1;
      `);
      await maintenanceClient.end();
      log.warn(`Database ${this.database} created`);

      await this.queryClient.connect();
    }
  }

  protected createMaintenanceClient() {
    return new PostgresQueryClient({
      ...this.queryClient.config,
      database: this.maintenanceDatabase,
    });
  }
}
