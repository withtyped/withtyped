export const noop = async () => {
  // Let it go
};

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
  yellow: '\u001B[33m',
});

export const color = (string: string | undefined, color: keyof typeof colors) =>
  process.stdout.isTTY
    ? colors[color] + (string ?? 'undefined') + colors.reset
    : string ?? 'undefined';

type Log = {
  debug: typeof console.log;
  warn: typeof console.log;
};

export const log: Log = {
  debug: (...args) => {
    if (['1', 'true', 'y', 'yes'].includes(process.env.DEBUG ?? '')) {
      console.debug(color('dbg', 'dim'), ...args);
    }
  },
  warn: (...args) => {
    console.warn(color('warn', 'yellow'), ...args);
  },
};

export const normalizePathname = (pathname: string) =>
  '/' + pathname.split('/').filter(Boolean).join('/');

export const normalizeString = (raw: string) =>
  raw.toLowerCase().replaceAll('\n', ' ').trim().replaceAll(/ {2,}/g, ' ');
