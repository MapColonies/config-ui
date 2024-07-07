import ajv, { AnySchemaObject, SchemaObject } from 'ajv';
import addFormats from 'ajv-formats';
import { getSchema } from '../api/client';

export const ajvInstance = new ajv({
  keywords: ['x-env-value'],
  discriminator: true,
  loadSchema: async (uri): Promise<AnySchemaObject> => {
    const schema = await getSchema({ id: uri, shouldDereference: false });
    return schema;
  },
  allErrors: true,
});

addFormats(ajvInstance);

export const validateJson = async (schema: SchemaObject | undefined, data: object) => {
  if (!schema) {
    return { isValid: false, errors: [{ message: 'Schema is missing' }] };
  }
  const validate = await ajvInstance.compileAsync(schema);
  const isValid = validate(data);
  return { isValid, errors: validate.errors };
};
