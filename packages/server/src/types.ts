// Manually define JSON types since `JSON.prase()` returns any
// https://github.com/Microsoft/TypeScript/issues/15225
/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/consistent-indexed-object-style */

/** Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#return_value */
export type Json = JsonObject | JsonArray | string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = {
  [key: string]: Json;
};
/* eslint-enable @typescript-eslint/ban-types, @typescript-eslint/consistent-indexed-object-style */

// Use the long version for a better dev experience since it would infer a clear type
export type Merge<A, B> = {
  [key in keyof (A & B)]: key extends keyof B ? B[key] : key extends keyof A ? A[key] : never;
};

export type Parser<T> = {
  parse: (data: unknown) => T;
};
