import { Box } from '@mui/material';
import { editor } from 'monaco-editor';
import { jsonFormatter } from '../../utils/jsonFormatter';
import { Editor } from '@monaco-editor/react';
import { useTheme } from '../../hooks/useTheme';

type MonacoViewerProps = {
  viewData: unknown;
  loading?: boolean;
};

export const MonacoViewer: React.FC<MonacoViewerProps> = ({ viewData, loading }) => {
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
        height={'85vh'}
        value={jsonString}
        options={options}
      />
    </Box>
  );
};
