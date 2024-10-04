import ajv, { AnySchemaObject, SchemaObject } from 'ajv/dist/2019.js';
import * as draft7MetaSchema from 'ajv/dist/refs/json-schema-draft-07.json' assert { type: 'json' };
import addFormats from 'ajv-formats';
import { getSchema } from '../api/client';
import { ErrorMessages } from './errors/error.types';

export const ajvInstance = new ajv({
  keywords: ['x-env-value'],
  useDefaults: true,
  discriminator: true,
  loadSchema: async (uri): Promise<AnySchemaObject> => {
    const schema = await getSchema({ id: uri, shouldDereference: false });
    return schema;
  },
  allErrors: true,
});

ajvInstance.addMetaSchema(draft7MetaSchema, 'http://json-schema.org/draft-07/schema#');

addFormats(ajvInstance);

export const validateJson = async (schema: SchemaObject | undefined, data: object) => {
  try {
    if (!schema) {
      return { isValid: false, errors: [{ message: ErrorMessages.SchemaMissing }] };
    }
    const validate = await ajvInstance.compileAsync(schema);
    const isValid = validate(structuredClone(data));
    return { isValid, errors: validate.errors };
  } catch (err) {
    let errorMessage = ErrorMessages.Unknown;
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return { isValid: false, errors: [{ message: errorMessage }] };
  }
};
