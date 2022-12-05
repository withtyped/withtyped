import type Model from '../model/index.js';
import type { QueryClient } from '../query/index.js';

export default abstract class DatabaseInitializer<Q extends QueryClient> {
  abstract readonly queryClient: Q;
  abstract readonly models: Array<Model<string>>;

  abstract initialize(): Promise<void>;
  abstract destroy(): Promise<void>;
  abstract tableSqlStrings(): string[];
}
