import { QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import { Router } from './routing/router';
import { ThemeProvider } from './context/themeContext';
import { closeSnackbar, SnackbarProvider } from 'notistack';
import { queryClient } from './api/tanstack/queryClient';
import { IconButton } from '@mui/material';
import { HighlightOff } from '@mui/icons-material';

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
