import type { Optional } from '@silverhand/essentials';
import { z, ZodType } from 'zod';

import type { ModelExtendConfig, ModelParseType, RawParserConfig } from './types.js';
import { PrimitiveType } from './types.js';

const typeToGuard = Object.freeze({
  boolean: z.boolean(),
  number: z.number(),
  string: z.string(),
  json: z.record(z.unknown()).or(z.array(z.unknown())),
  date: z.date(),
} satisfies Record<PrimitiveType, ZodType>);

const convertRawConfig = (config: RawParserConfig): z.ZodType => {
  // eslint-disable-next-line @silverhand/fp/no-let
  let guard: z.ZodType = typeToGuard[config.type];

  if (config.isArray) {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    guard = guard.array();
  }

  if (config.isNullable) {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    guard = guard.nullable();
  }

  return guard;
};

export const convertConfigToZod = (
  config: RawParserConfig,
  extendedConfig: ModelExtendConfig<unknown> | undefined,
  forType: ModelParseType
): Optional<z.ZodType> => {
  const parser = extendedConfig?.parser ?? convertRawConfig(config);

  // eslint-disable-next-line default-case
  switch (forType) {
    case 'model':
      return parser;

    case 'create':
      if (extendedConfig?.default) {
        const { default: defaultValue, readonly } = extendedConfig;

        return readonly
          ? z
              .undefined()
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              .transform(() => (typeof defaultValue === 'function' ? defaultValue() : defaultValue))
          : parser.default(defaultValue);
      }

      if (extendedConfig?.readonly) {
        return z.undefined();
      }

      if (config.hasDefault) {
        return parser.optional();
      }

      return parser;

    case 'patch':
      if (extendedConfig?.readonly) {
        return z.undefined();
      }

      return parser.optional();
  }
};
