import type { BaseContext, HttpContext, NextFunction } from '../middleware.js';
import type { MergeRequestContext } from './with-request.js';

export type WithBodyContext<InputContext extends BaseContext> = MergeRequestContext<
  InputContext,
  { body: unknown }
>;

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

    return next({ ...context, request: { ...context.request, body: JSON.parse(raw.toString()) } });
  };
}
