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

export const tryJson = async (response: Response) => {
  try {
    // It defines as any, and we already guarded in server :-)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await response.json();
  } catch {}
};
