import assert from 'node:assert';

import type { ValuesOf } from '@silverhand/essentials';
import { conditional } from '@silverhand/essentials';
import type { ZodStringDef } from 'zod';
import {
  ZodOptional,
  ZodNullable,
  ZodNativeEnum,
  ZodEnum,
  ZodLiteral,
  ZodUnknown,
  ZodUnion,
  ZodObject,
  ZodArray,
  ZodString,
  ZodNumber,
  ZodBoolean,
  ZodEffects,
} from 'zod';

import type { OpenAPIV3 } from '../openapi/openapi-types.js';

// https://github.com/colinhacks/zod#literals
const zodLiteralToSwagger = (zodLiteral: ZodLiteral<unknown>): OpenAPIV3.SchemaObject => {
  const { value } = zodLiteral;

  switch (typeof value) {
    case 'boolean': {
      return {
        type: 'boolean',
        format: String(value),
      };
    }
    case 'number': {
      return {
        type: 'number',
        format: String(value),
      };
    }
    case 'string': {
      return {
        type: 'string',
        format: value === '' ? 'empty' : `"${value}"`,
      };
    }
    default: {
      throw new Error('Invalid Zod type to transform');
    }
  }
};

// Switch-clause

const zodStringCheckToSwaggerFormatKind = (zodStringCheck: ValuesOf<ZodStringDef['checks']>) => {
  const { kind } = zodStringCheck;

  switch (kind) {
    case 'email':
    case 'url':
    case 'uuid':
    case 'cuid':
    case 'regex': {
      return kind;
    }

    case 'min':
    case 'max': {
      // Swagger has dedicated fields for min/max
      return;
    }

    default: {
      throw new Error('Invalid Zod type to transform');
    }
  }
};

// https://github.com/colinhacks/zod#strings
const zodStringToSwagger = (zodString: ZodString): OpenAPIV3.SchemaObject => {
  const { checks } = zodString._def;

  const formats = checks
    .map((zodStringCheck) => zodStringCheckToSwaggerFormatKind(zodStringCheck))
    .filter(Boolean);
  const minLength = checks.find(
    (check): check is { kind: 'min'; value: number } => check.kind === 'min'
  )?.value;
  const maxLength = checks.find(
    (check): check is { kind: 'max'; value: number } => check.kind === 'max'
  )?.value;
  const pattern = checks
    .find((check): check is { kind: 'regex'; regex: RegExp } => check.kind === 'regex')
    ?.regex.toString();

  return {
    type: 'string',
    format: formats.length > 0 ? formats.join(' | ') : undefined,
    minLength,
    maxLength,
    pattern,
  };
};

// Too many zod types :-)
// eslint-disable-next-line complexity
export const zodTypeToSwagger = (config: unknown): OpenAPIV3.SchemaObject => {
  if (config instanceof ZodOptional) {
    return zodTypeToSwagger(config._def.innerType);
  }

  if (config instanceof ZodNullable) {
    return {
      nullable: true,
      ...zodTypeToSwagger(config._def.innerType),
    };
  }

  if (config instanceof ZodNativeEnum || config instanceof ZodEnum) {
    return {
      type: 'string',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      enum: Object.values(config.enum),
    };
  }

  if (config instanceof ZodLiteral) {
    return zodLiteralToSwagger(config);
  }

  if (config instanceof ZodUnknown) {
    return { example: {} }; // Any data type
  }

  if (config instanceof ZodUnion) {
    return {
      // ZodUnion.options type is any

      oneOf: (config.options as unknown[]).map((option) => zodTypeToSwagger(option)),
    };
  }

  if (config instanceof ZodObject) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const entries = Object.entries(config.shape);
    const required = entries
      .filter(([, value]) => !(value instanceof ZodOptional))
      .map(([key]) => key);

    return {
      type: 'object',
      required: conditional(required.length > 0 && required),
      properties: Object.fromEntries(entries.map(([key, value]) => [key, zodTypeToSwagger(value)])),
    };
  }

  if (config instanceof ZodArray) {
    return {
      type: 'array',
      items: zodTypeToSwagger(config._def.type),
    };
  }

  if (config instanceof ZodString) {
    return zodStringToSwagger(config);
  }

  if (config instanceof ZodNumber) {
    return {
      type: 'number',
    };
  }

  if (config instanceof ZodBoolean) {
    return {
      type: 'boolean',
    };
  }

  // TO-DO: Improve swagger output for zod schema with refinement (validate through JS functions)
  if (config instanceof ZodEffects && config._def.effect.type === 'refinement') {
    return {
      type: 'object',
      description: 'Validator function',
    };
  }

  throw new Error('Invalid Zod type to transform');
};

// Parameter serialization: https://swagger.io/docs/specification/serialization
export const zodTypeToParameters = (
  zodParameters: unknown,
  inWhere: 'path' | 'search' = 'search'
): OpenAPIV3.ParameterObject[] => {
  if (!zodParameters) {
    return [];
  }

  assert(zodParameters instanceof ZodObject, 'Zod type for parameters must be an object');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return Object.entries(zodParameters.shape).map(([key, value]) => ({
    name: key,
    in: inWhere,
    required: !(value instanceof ZodOptional),
    schema: zodTypeToSwagger(value),
  }));
};
