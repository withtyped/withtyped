import type Model from '../model/index.js';
import type { ModelParseReturnType, ModelParseType, RawParserConfig } from '../model/index.js';
import type { OpenAPIV3 } from '../openapi/openapi-types.js';
import type { Parser } from '../types.js';

export default class ModelParser<
  CreateType extends Record<string, unknown>,
  ModelType extends CreateType = CreateType,
  ParseType extends ModelParseType = 'model'
> {
  constructor(
    public readonly model: Model<string, CreateType, ModelType>,
    public readonly parseType?: ParseType
  ) {}

  parse(data: unknown): ModelParseReturnType<CreateType, ModelType>[ParseType] {
    return this.model.parse(data, this.parseType);
  }

  toOpenApiSchemaObject(
    fallback?: <T>(guard?: Parser<T>) => OpenAPIV3.SchemaObject
  ): OpenAPIV3.SchemaObject {
    const rawEntries = Object.entries(this.model.rawConfigs);
    const properties: Record<string, OpenAPIV3.SchemaObject> = {};
    const examples = { date: new Date().toISOString() };

    const toSchemaObject = ({ type, isNullable }: RawParserConfig): OpenAPIV3.SchemaObject => {
      switch (type) {
        case 'json':
          return { type: 'object', format: 'JSON', nullable: isNullable, example: {} };
        case 'date':
          return { type: 'string', format: 'Date', nullable: isNullable, example: examples.date };
        default:
          return {
            type,
            nullable: isNullable,
          };
      }
    };

    for (const [key, value] of rawEntries) {
      const item = toSchemaObject(value);

      // eslint-disable-next-line @silverhand/fp/no-mutation
      properties[key] = value.isArray
        ? {
            type: 'array',
            items: item,
          }
        : item;
    }

    if (fallback) {
      for (const [key, value] of Object.entries(this.model.extendedConfigs)) {
        // eslint-disable-next-line @silverhand/fp/no-mutation
        properties[key] = fallback(value);
      }
    }

    return {
      type: 'object',
      required: rawEntries
        .filter(
          ([, value]) =>
            !((this.parseType === 'create' && value.hasDefault) || this.parseType === 'patch')
        )
        .map(([key]) => key),
      properties,
    };
  }
}
