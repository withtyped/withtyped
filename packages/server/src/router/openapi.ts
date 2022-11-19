import type { OpenAPIV3 } from '../openapi/openapi-types.js';
import type { Parser, RouterHandlerMap } from './types.js';

const contentJson = 'application/json';
const defaultInfo: OpenAPIV3.InfoObject = { title: 'API reference', version: '0.1.0' };
const defaultResponses: OpenAPIV3.ResponsesObject = {
  '204': {
    description: 'No content',
  },
};

const parseParameters = (path: string): OpenAPIV3.ParameterObject[] =>
  path
    .split('/')
    .filter((part) => part.startsWith(':'))
    .map((part) => ({
      name: part.slice(1),
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }));

export const buildOpenApiJson = (
  handlerMap: RouterHandlerMap,
  parseQuery: <T>(guard?: Parser<T>) => OpenAPIV3.ParameterObject[],
  parse: <T>(guard?: Parser<T>) => OpenAPIV3.SchemaObject,
  info = defaultInfo
): OpenAPIV3.Document => {
  type MethodMap = {
    [key in OpenAPIV3.HttpMethods]?: OpenAPIV3.OperationObject;
  };

  const pathMap = new Map<string, MethodMap>();

  for (const [method, handlers] of Object.entries(handlerMap)) {
    for (const { path, guard } of handlers) {
      const operationObject: OpenAPIV3.OperationObject = {
        parameters: [...parseParameters(path), ...parseQuery(guard?.query)],
        requestBody: guard?.body && {
          required: true,
          content: { [contentJson]: { schema: parse(guard.body) } },
        },
        responses: guard?.response
          ? {
              '200': {
                description: 'OK',
                content: { [contentJson]: { schema: parse(guard.response) } },
              },
            }
          : defaultResponses,
      };

      pathMap.set(path, {
        ...pathMap.get(path),
        [method]: operationObject,
      });
    }
  }

  return {
    openapi: '3.0.1',
    info,
    paths: Object.fromEntries(pathMap),
  };
};
