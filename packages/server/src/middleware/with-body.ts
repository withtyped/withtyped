import type { HttpContext, NextFunction } from '../middleware.js';
import type { Json } from '../types.js';
import type { MergeRequestContext, RequestContext } from './with-request.js';

export type WithBodyContext<InputContext extends RequestContext> = MergeRequestContext<
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

export default function withBody<InputContext extends RequestContext>() {
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
