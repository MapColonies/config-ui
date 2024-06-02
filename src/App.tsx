import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import { Router } from './routing/router';
import { ThemeProvider } from '@mui/material';
import { materialUITheme } from './theme/materialUI';

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <ThemeProvider theme={materialUITheme}>
        <QueryClientProvider client={queryClient}>
          <Router />
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
