import { EditorProps, Editor, OnChange, OnMount, BeforeMount, useMonaco } from '@monaco-editor/react';
import { Box, LinearProgress } from '@mui/material';
import { editor, languages } from 'monaco-editor';
import { useEffect, useMemo, useState } from 'react';
import { registerRefSnippet } from '../../utils/monaco/register/registerRefSnippet';
import { registerRefHoverProvider } from '../../utils/monaco/register/registerRefHoverProvider';
import { useTheme } from '../../hooks/useTheme';

type MonacoEditorProps = EditorProps & { readonly?: boolean; isFetching?: boolean; schema?: languages.json.JSONSchema };

export const MonacoEditor: React.FC<MonacoEditorProps> = (editorProps) => {
  const { schema, readonly = false, isFetching = false, onChange, theme } = editorProps;
  const [loadProgressBar, setLoadProgressBar] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');

  const monaco = useMonaco();
  const { isDarkMode } = useTheme();

  const options: editor.IStandaloneEditorConstructionOptions = {
    readOnly: readonly,
  };

  const diagnosticOptions: languages.json.DiagnosticsOptions = useMemo(() => {
    if (!schema) {
      return {};
    }

    const options: languages.json.DiagnosticsOptions = {
      validate: true,
      schemas: [
        {
          uri: schema.id ?? '',
          schema: schema,

          fileMatch: ['*'],
        },
      ],
    };
    return options;
  }, [schema]);

  useEffect(() => {
    if (!monaco) {
      return;
    }
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions(diagnosticOptions);
    const snippetProvider = registerRefSnippet(monaco);
    const hoverProvider = registerRefHoverProvider(monaco);

    return () => {
      snippetProvider.dispose();
      hoverProvider.dispose();
    };
  }, [monaco, diagnosticOptions]);

  const handleCodeChange: OnChange = (value: string | undefined, ev: editor.IModelContentChangedEvent) => {
    setCode(value ?? '');
    if (onChange) {
      onChange(value, ev);
    }
  };
  const editorDidMount: OnMount = (editor) => {
    editor.focus();
  };

  const handleBeforeMount: BeforeMount = () => {
    setLoadProgressBar(true);
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      {loadProgressBar && <LinearProgress value={100} variant={isFetching ? 'indeterminate' : 'determinate'} />}
      <Editor
        width={'100%'}
        defaultLanguage={'json'}
        theme={isDarkMode ? 'vs-dark' : 'light'}
        value={code}
        options={options}
        {...editorProps}
        onChange={handleCodeChange}
        onMount={editorDidMount}
        beforeMount={handleBeforeMount}
      />
    </Box>
  );
};
