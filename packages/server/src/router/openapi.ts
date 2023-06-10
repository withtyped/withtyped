import { contentTypes } from '@withtyped/shared';

import type { RequestContext } from '../middleware/with-request.js';
import type { OpenAPIV3 } from '../openapi/openapi-types.js';
import type { Parser } from '../types.js';

import type { MethodRoutesMap } from './index.js';

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

export const buildOpenApiJson = <InputContext extends RequestContext>(
  routesMap: MethodRoutesMap<InputContext>,
  parseSearch?: <T>(guard?: Parser<T>) => OpenAPIV3.ParameterObject[],
  parse?: <T>(guard?: Parser<T>) => OpenAPIV3.SchemaObject,
  info?: Partial<OpenAPIV3.InfoObject>
): OpenAPIV3.Document => {
  type MethodMap = {
    [key in OpenAPIV3.HttpMethods]?: OpenAPIV3.OperationObject;
  };

  const tryParse = (guard: Parser<unknown>) => {
    return parse?.(guard);
  };

  const pathMap = new Map<string, MethodMap>();

  for (const [method, routes] of Object.entries(routesMap)) {
    for (const { fullPath, path, guard } of routes) {
      const operationObject: OpenAPIV3.OperationObject = {
        parameters: [...parseParameters(path), ...(parseSearch?.(guard.search) ?? [])],
        requestBody: guard.body && {
          required: true,
          content: { [contentTypes.json]: { schema: tryParse(guard.body) } },
        },
        responses: guard.response
          ? {
              '200': {
                description: 'OK',
                content: { [contentTypes.json]: { schema: tryParse(guard.response) } },
              },
            }
          : defaultResponses,
      };

      pathMap.set(fullPath, {
        ...pathMap.get(fullPath),
        [method]: operationObject,
      });
    }
  }

  return {
    openapi: '3.0.1',
    info: { ...defaultInfo, ...info },
    paths: Object.fromEntries(pathMap),
  };
};
