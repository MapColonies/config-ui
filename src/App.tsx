import { QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import { Router } from './routing/router';
import { ThemeProvider } from './context/themeContext';
import { SnackbarProvider } from 'notistack';
import { queryClient } from './api/tanstack/queryClient';

function App() {
  return (
    <>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider>
            <Router />
          </SnackbarProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
