import { EditorProps, Editor, OnChange, OnMount } from '@monaco-editor/react';
import { editor, languages } from 'monaco-editor';
import { useState } from 'react';

type MonacoEditorProps = EditorProps & { readonly?: boolean; diagnosticOptions?: languages.json.DiagnosticsOptions };

export const MonacoEditor: React.FC<MonacoEditorProps> = (editProps) => {
  const { readonly = false, onChange, theme } = editProps;
  const [code, setCode] = useState<string>('');

  const options: editor.IStandaloneEditorConstructionOptions = {
    readOnly: readonly,
  };

  const handleCodeChange: OnChange = (value: string | undefined, ev: editor.IModelContentChangedEvent) => {
    setCode(value ?? '');
    if (onChange) {
      onChange(value, ev);
    }
  };
  const editorDidMount: OnMount = (editor) => {
    editor.focus();
  };

  return (
    <>
      <Editor
        width={'100%'}
        defaultLanguage={'json'}
        theme={theme ?? 'vs-dark'}
        value={code}
        options={options}
        {...editProps}
        onChange={handleCodeChange}
        onMount={editorDidMount}
      />
    </>
  );
};
