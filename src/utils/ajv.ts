import ajv, { AnySchemaObject, SchemaObject } from 'ajv/dist/2019.js';
import * as draft7MetaSchema from 'ajv/dist/refs/json-schema-draft-07.json' assert { type: 'json' };
import addFormats from 'ajv-formats';
import { getSchema } from '../api/client';
import { ErrorMessages } from './errors/error.types';

// Create a Map to store AJV instances for different schema types
const ajvInstances = new Map<string, ajv>();

function getAjvInstance(instanceKey: string): ajv {
  if (!ajvInstances.has(instanceKey)) {
    const instance = new ajv({
      keywords: ['x-env-value', 'x-env-format'],
      useDefaults: true,
      discriminator: true,
      loadSchema: async (uri): Promise<AnySchemaObject> => {
        const schema = await getSchema({ id: uri, shouldDereference: false });
        return schema;
      },
      allErrors: true,
    });

    instance.addMetaSchema(draft7MetaSchema, 'http://json-schema.org/draft-07/schema#');
    addFormats(instance);
    ajvInstances.set(instanceKey, instance);
  }
  return ajvInstances.get(instanceKey)!;
}

export const validateJson = async (schema: SchemaObject | undefined, data: object) => {
  try {
    if (!schema) {
      return { isValid: false, errors: [{ message: ErrorMessages.SchemaMissing }] };
    }

    // Determine if this is a dereferenced schema by checking if it contains no $ref properties
    const schemaStr = JSON.stringify(schema);
    const isDereferenced = !schemaStr.includes('"$ref"');

    // Use different AJV instances for normal vs dereferenced schemas
    const instanceKey = isDereferenced ? 'dereferenced' : 'normal';
    const ajvInstance = getAjvInstance(instanceKey);

    // Use the original schema ID for caching within each instance
    const schemaId = schema.$id || schema.id;
    let validate;

    if (schemaId && ajvInstance.getSchema(schemaId)) {
      // Schema is already compiled, get it from cache
      validate = ajvInstance.getSchema(schemaId);
    } else {
      // Schema is not compiled yet, compile it
      try {
        validate = await ajvInstance.compileAsync(schema);
      } catch (err) {
        // If compilation fails due to duplicate schema, try removing it first
        if (err instanceof Error && (err.message.includes('already exists') || err.message.includes('resolves to more than one schema'))) {
          if (schemaId) {
            ajvInstance.removeSchema(schemaId);
          }
          validate = await ajvInstance.compileAsync(schema);
        } else {
          throw err;
        }
      }
    }

    if (!validate) {
      return { isValid: false, errors: [{ message: 'Failed to compile schema' }] };
    }

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
