import { contentTypes, log, RequestMethod } from '@withtyped/shared';

import RequestError from '../errors/RequestError.js';
import type { HttpContext, NextFunction } from '../middleware.js';
import type { Json } from '../types.js';

import type { MergeRequestContext, RequestContext } from './with-request.js';

export type WithBodyContext<InputContext extends RequestContext> = MergeRequestContext<
  InputContext,
  { body?: Json }
>;

const tryParse = (body: string): Json | undefined => {
  try {
    // `body` is not `any`, but `JSON.parse()` returns `any`. :shrug:
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(body);
  } catch (error: unknown) {
    log.debug('failed to parse JSON string in `withBody()`', error);
  }
};

export default function withBody<InputContext extends RequestContext>() {
  return async (
    context: InputContext,
    next: NextFunction<WithBodyContext<InputContext>>,
    { request }: HttpContext
  ) => {
    if (
      !context.request.method ||
      [RequestMethod.GET, RequestMethod.OPTIONS, RequestMethod.HEAD].includes(
        context.request.method
      )
    ) {
      // eslint-disable-next-line no-restricted-syntax
      return next(context as WithBodyContext<InputContext>); // No need to spread since nothing needs to change
    }

    const readBody = async () =>
      new Promise<Buffer>((resolve, reject) => {
        const body: Uint8Array[] = [];
        // eslint-disable-next-line @silverhand/fp/no-mutating-methods
        const pushToBody = (chunk: Uint8Array | Buffer) => body.push(chunk);

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
    const rawString = raw.toString();

    if (!rawString) {
      // eslint-disable-next-line no-restricted-syntax
      return next(context as WithBodyContext<InputContext>);
    }

    if (context.request.headers['content-type'] !== contentTypes.json) {
      throw new RequestError(
        `Unexpected \`content-type\` header, only accept "${contentTypes.json}"`,
        400
      );
    }

    return next({ ...context, request: { ...context.request, body: tryParse(rawString) } });
  };
}
