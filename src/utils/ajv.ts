import ajv, { AnySchemaObject, SchemaObject } from 'ajv';
import addFormats from 'ajv-formats';
import { getSchema } from '../api/client';
import { ErrorMessages } from './errors/error.types';

export const ajvInstance = new ajv({
  keywords: ['x-env-value'],
  discriminator: true,
  loadSchema: async (uri): Promise<AnySchemaObject> => {
    const schema = await getSchema({ id: uri, shouldDereference: false });
    return schema;
  },
});

addFormats(ajvInstance);

export const validateJson = async (schema: SchemaObject | undefined, data: object) => {
  try {
    if (!schema) {
      return { isValid: false, message: ErrorMessages.SchemaMissing };
    }
    const validate = await ajvInstance.compileAsync(schema);
    const isValid = validate(data);
    return { isValid, message: validate.errors?.[0].message };
  } catch (err) {
    let errorMessage = ErrorMessages.Unknown;
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return { isValid: false, message: errorMessage };
  }
};
