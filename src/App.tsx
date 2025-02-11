import { QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import { Router } from './routing/router';
import { ThemeProvider } from './context/themeContext';
import { closeSnackbar, SnackbarProvider } from 'notistack';
import { queryClient } from './api/tanstack/queryClient';
import { IconButton } from '@mui/material';
import { HighlightOff } from '@mui/icons-material';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

loader.config({ monaco });

loader.init().then(() => {
  console.log('initialized monaco loaders');
});

function App() {
  return (
    <>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider
            action={(snackbarId) => (
              <IconButton onClick={() => closeSnackbar(snackbarId)}>
                <HighlightOff />
              </IconButton>
            )}
          >
            <Router />
          </SnackbarProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
