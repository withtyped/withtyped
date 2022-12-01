import type { Parser } from './types.js';

export const tryThat = <T>(run: () => T): T | undefined => {
  try {
    return run();
  } catch {}
};

export const createParser = <T>(parse: (data: unknown) => T): Parser<T> => ({ parse });
