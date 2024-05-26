import { BrowserRouter, Navigate, useRoutes } from 'react-router-dom';
import { routes } from './routes';

import { Layout } from '../layout/layout';
import { ConfigsPage } from '../pages/configs/configsPage';
import { SchemasPage } from '../pages/schemas/schemas';
import { NotFoundPage } from '../pages/notFound/notFound';

export const Router: React.FC = () => {
  const Routes: React.FC = () => {
    return useRoutes([
      { path: '*', element: <Navigate to={routes.NOT_FOUND} /> },
      { path: routes.CONFIG, element: <ConfigsPage /> },
      { path: routes.SCHEMA, element: <SchemasPage /> },
      { path: routes.NOT_FOUND, element: <NotFoundPage /> },
      { path: routes.HOME, element: <ConfigsPage /> },
    ]);
  };

  return (
    <BrowserRouter>
      <Layout>
        <Routes />
      </Layout>
    </BrowserRouter>
  );
};
