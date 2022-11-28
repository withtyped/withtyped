import type { Parser } from './types.js';

export const colors = Object.freeze({
  reset: '\u001B[0m',
  bright: '\u001B[1m',
  dim: '\u001B[2m',
  black: '\u001B[30m',
  red: '\u001B[31m',
  green: '\u001B[32m',
  blue: '\u001B[34m',
  magenta: '\u001B[35m',
  cyan: '\u001B[36m',
});

export const color = (string: string, color: keyof typeof colors) =>
  colors[color] + string + colors.reset;

export const noop = async () => {
  // Let it go
};

export const tryThat = <T>(run: () => T): T | undefined => {
  try {
    return run();
  } catch {}
};

type Log = {
  debug: typeof console.log;
};

export const log: Log = {
  debug: (...args) => {
    if (['1', 'true', 'y', 'yes'].includes(process.env.DEBUG ?? '')) {
      console.log(color('dbg', 'dim'), ...args);
    }
  },
};

export const createParser = <T>(parse: (data: unknown) => T): Parser<T> => ({ parse });
