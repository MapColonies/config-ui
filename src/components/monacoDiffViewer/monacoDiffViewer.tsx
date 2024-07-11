import { DiffEditor } from '@monaco-editor/react';
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Box, Typography } from '@mui/material';

type MonacoDiffViewerProps = {
  original: string;
  modified: string;
  originalTitle?: string;
  modifiedTitle?: string;
  height?: number | string;
};

export const MonacoDiffViewer: React.FC<MonacoDiffViewerProps> = ({ original, modified, originalTitle, modifiedTitle, height }) => {
  const { isDarkMode } = useTheme();
  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Box flex="1" pr={1}>
          <Typography variant="h6" align="left">
            {originalTitle}
          </Typography>
        </Box>
        <Box flex="1" pl={1}>
          <Typography variant="h6" align="left">
            {modifiedTitle}
          </Typography>
        </Box>
      </Box>
      <DiffEditor
        language="json"
        theme={isDarkMode ? 'vs-dark' : 'light'}
        original={original}
        modified={modified}
        options={{ readOnly: true }}
        height={height}
      />
    </>
  );
};
