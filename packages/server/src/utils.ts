export const noop = async () => {
  // Let it go
};

export const tryThat = <T>(run: () => T): T | undefined => {
  try {
    return run();
  } catch {}
};
