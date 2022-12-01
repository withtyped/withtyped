export type QueryResult<T> = { rows: T[]; rowCount: number };

export * from './utils.js';
export { default as QueryClient } from './client.js';
