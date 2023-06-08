import { log } from '@withtyped/shared';

export const tryThat = <T>(run: () => T): T | undefined => {
  try {
    return run();
  } catch (error: unknown) {
    log.debug('tryThat() caught error', error);
  }
};
