import { Box } from '@mui/material';
import { editor } from 'monaco-editor';
import { jsonFormatter } from '../../utils/jsonFormatter';
import { Editor } from '@monaco-editor/react';
import { useTheme } from '../../hooks/useTheme';

type MonacoViewerProps = {
  viewData: unknown;
  loading?: boolean;
  height?: number | string;
};

export const MonacoViewer: React.FC<MonacoViewerProps> = ({ viewData, loading, height }) => {
  const { isDarkMode } = useTheme();
  const jsonString = jsonFormatter(viewData);
  const options: editor.IStandaloneEditorConstructionOptions = {
    readOnly: true,
  };
  return (
    <Box>
      <Editor
        defaultLanguage={'json'}
        theme={isDarkMode ? 'vs-dark' : 'light'}
        loading={loading}
        height={height}
        value={jsonString}
        options={options}
      />
    </Box>
  );
};
