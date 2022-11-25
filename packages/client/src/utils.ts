export const buildSearchString = (record?: Record<string, string | string[]>) =>
  record
    ? Object.entries(record)
        .flatMap(([key, value]) =>
          Array.isArray(value) ? value.map((value) => `${key}=${value}`) : `${key}=${value}`
        )
        .join('&')
    : '';

export const tryJson = async (response: Response) => {
  try {
    // It defines as any, and we already guarded in server :-)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await response.json();
  } catch {}
};
