export const buildSearch = (record?: Record<string, string | string[]>) => {
  const parameters = new URLSearchParams();

  for (const [key, value] of Object.entries(record ?? {})) {
    if (Array.isArray(value)) {
      for (const element of value) {
        parameters.append(key, element);
      }
    } else {
      parameters.append(key, value);
    }
  }

  return parameters;
};

// Copied from `@silverhand/essentials`
// Use this implementation over `node:util/types` to recognize non-native promises.
export const isPromise = (value: unknown): value is Promise<unknown> =>
  value !== null &&
  (typeof value === 'object' || typeof value === 'function') &&
  'then' in value &&
  typeof value.then === 'function';
