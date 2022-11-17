import type { BaseContext, HttpContext, NextFunction } from '../middleware.js';
import type { MergeRequestContext } from './with-request.js';

/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/consistent-indexed-object-style */
// Manually define JSON types since `JSON.prase()` returns any
// https://github.com/Microsoft/TypeScript/issues/15225

/** Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#return_value */
export type Json = JsonObject | JsonArray | string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = {
  [key: string]: Json;
};
/* eslint-enable @typescript-eslint/ban-types, @typescript-eslint/consistent-indexed-object-style */

export type WithBodyContext<InputContext extends BaseContext> = MergeRequestContext<
  InputContext,
  { body?: Json }
>;

const tryParse = (body: Buffer): Json | undefined => {
  try {
    // `body` is not `any`, but `JSON.parse()` returns `any`. :shrug:
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(body.toString());
  } catch {}
};

export default function withBody<InputContext extends BaseContext>() {
  return async (
    context: InputContext,
    next: NextFunction<WithBodyContext<InputContext>>,
    { request }: HttpContext
  ) => {
    const readBody = async () =>
      new Promise<Buffer>((resolve, reject) => {
        const body: Uint8Array[] = [];
        // eslint-disable-next-line @silverhand/fp/no-mutating-methods
        const pushToBody = (chunk: Uint8Array) => body.push(chunk);

        request
          .on('data', pushToBody)
          .once('end', () => {
            request.removeListener('data', pushToBody);
            resolve(Buffer.concat(body));
          })
          .once('error', (error) => {
            request.removeListener('data', pushToBody);
            reject(error);
          });
      });

    const raw = await readBody();

    return next({ ...context, request: { ...context.request, body: tryParse(raw) } });
  };
}
