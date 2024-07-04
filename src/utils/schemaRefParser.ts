import $RefParser, { JSONSchema } from '@apidevtools/json-schema-ref-parser';
import { getSchema, GetSchemaResponse } from '../api/client';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

export const dereferenceJsonSchema = async (schema: GetSchemaResponse) => {
  const schemaCopy = { ...schema };
  return $RefParser.dereference(schemaCopy, {
    dereference: { circular: false },
    resolve: {
      mapcolonies: {
        canRead: /^https:\/\/mapcolonies.com\/.*/,
        order: 1,
        read: async (file: { url: string }) => {
          console.log('file', file);
          const res = await getSchema({ id: file.url, shouldDereference: false });
          return res as JSONSchema;
        },
      },
    },
  });
};

export const isSchemaRef = (text: string): boolean => {
  return text.includes('$ref');
};
