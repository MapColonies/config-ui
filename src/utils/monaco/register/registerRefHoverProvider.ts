import { Monaco } from '@monaco-editor/react';
import { extractRefConfig, fetchConfigData } from '../refHandler';
import { routes } from '../../../routing/routes';

export const registerRefHoverProvider = (monaco: Monaco) => {
  return monaco.languages.registerHoverProvider('json', {
    provideHover: async (model, position) => {
      const word = model.getWordAtPosition(position);
      const isRefWord = word?.word.startsWith('$ref') ?? false;
      if (!isRefWord) {
        return;
      }

      try {
        const refDetails = extractRefConfig(model, position);
        if (!refDetails) {
          return;
        }

        const cacheConfig = await fetchConfigData(refDetails);
        console.log('cacheConfig', cacheConfig);

        if (!cacheConfig) {
          throw new Error('Config not found');
        }
        const schemaPageLink = `${routes.VIEW_SCHEMA}?schemaId=${cacheConfig.schemaId}`;
        const linkToSchema = `[${cacheConfig.schemaId}](${schemaPageLink})`;
        return {
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          contents: [
            {
              value: `#### ${refDetails.name}:${refDetails.version}\n #### ${linkToSchema}\n\n\`\`\`json\n${JSON.stringify(cacheConfig.config, null, 4)}\n\`\`\``,
            },
          ],
        };
      } catch (e) {
        return {
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          contents: [{ value: `**Error:** ${(e as Error).message}` }],
        };
      }
    },
  });
};
