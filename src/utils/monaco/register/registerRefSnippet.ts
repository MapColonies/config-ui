import { Monaco } from '@monaco-editor/react';

export const registerRefSnippet = (monaco: Monaco) => {
  return monaco.languages.registerCompletionItemProvider('json', {
    triggerCharacters: ['"'], // Trigger when user types a double quote
    provideCompletionItems: (model, position) => {
      // Extract the text from the beginning of the line to the cursor position
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // Determine the start of the replace range based on the context
      let replaceStart = position.column;
      if (textUntilPosition.endsWith('"$ref":')) {
        replaceStart -= 7; // Include the full "$ref": text
      } else if (textUntilPosition.endsWith('"$ref')) {
        replaceStart -= 5; // Include partial "$ref text
      } else if (textUntilPosition.endsWith('"$')) {
        replaceStart -= 2; // Include partial "$ text
      }

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: replaceStart,
        endColumn: position.column,
      };
      const insertText = `"$ref": {"configName": "", "version": "latest", "schemaId": ""}`;
      return {
        suggestions: [
          {
            label: '"$ref":',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: insertText,
            range: range,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.None,
            detail: 'Insert $ref property',
            documentation: {
              value: 'Inserts a $ref snippet with configName, version, and schemaId fields',
              isTrusted: true,
            },
            sortText: 'aa', // Ensure it sorts above other suggestions
          },
        ],
      };
    },
  });
};
