const baseSchemaUrl = 'https://mapcolonies.com/';
export const removeBaseUrlFromSchemaId = (schemaId: string): string => {
  return schemaId.replace(baseSchemaUrl, '');
};
