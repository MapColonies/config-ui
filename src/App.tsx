import { QueryClient, QueryClientProvider } from 'react-query';
import './App.css';
import { Router } from './routing/router';

function App() {
  return (
    <>
      <QueryClientProvider client={new QueryClient()}>
        <Router />
      </QueryClientProvider>
    </>
  );
}

export default App;
