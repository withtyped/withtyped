import { log } from '@withtyped/shared';

import type { Parser } from './types.js';

export const tryThat = <T>(run: () => T): T | undefined => {
  try {
    return run();
  } catch (error: unknown) {
    log.debug('tryThat() caught error', error);
  }
};

export const createParser = <T>(parse: (data: unknown) => T): Parser<T> => ({ parse });
