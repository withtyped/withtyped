import assert from 'node:assert';
import { describe, it } from 'node:test';

import OpenAPISchemaValidator from 'openapi-schema-validator';
import { z } from 'zod';

import { createModel } from '../model/index.js';
import type { OpenAPIV3 } from '../openapi/openapi-types.js';
import { zodTypeToSwagger } from '../test-utils/openapi.test.js';
import ModelParser from './index.js';

describe('ModelParser', () => {
  it('should return valid OpenAPI JSON', () => {
    const parser = new ModelParser(
      createModel(`
      create table books (
        id varchar(128) not null,
        author_ids varchar(128) array not null,
        custom_data jsonb,
        created_at timestamptz not null default(now())
      );
    `).extend('customData', z.object({ foo: z.string() })),
      'create'
    );

    // @ts-expect-error have to do this, looks like a module loader issue
    const Validator = OpenAPISchemaValidator.default as typeof OpenAPISchemaValidator;

    const validator = new Validator({ version: 3 });
    const document: OpenAPIV3.Document = {
      openapi: '3.0.1',
      info: { title: 'Test', version: '0.1.0' },
      paths: {},
      components: {
        schemas: {
          Book: parser.toOpenApiSchemaObject(zodTypeToSwagger),
        },
      },
    };
    // Maybe more detailed validation?
    assert.deepStrictEqual(validator.validate(document).errors, []);
  });
});
