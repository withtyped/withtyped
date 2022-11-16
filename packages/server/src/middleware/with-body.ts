import type { BaseContext, HttpContext, NextFunction } from '../middleware.js';

export type MergeRequestContext<InputContext extends BaseContext, MergeType> = Omit<
  InputContext,
  'request'
> & { request: InputContext['request'] & MergeType };

export type WithBodyContext<InputContext extends BaseContext> = MergeRequestContext<
  InputContext,
  { body: Buffer }
>;

export default function withBody() {
  return async <InputContext extends BaseContext>(
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

    return next({ ...context, request: { body: await readBody() } });
  };
}
