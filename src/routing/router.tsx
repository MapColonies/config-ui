import { BrowserRouter, Navigate, useRoutes } from 'react-router-dom';
import { routes } from './routes';

import { ConfigsPage } from '../pages/configs/configsPage';
import { SchemasPage } from '../pages/schemas/schemas';
import { NotFoundPage } from '../pages/notFound/notFound';
import { ViewConfigsPage } from '../pages/viewConfig/viewConfig';
import { ViewSchemaPage } from '../pages/viewSchema/viewSchema';
import { CreateConfigsPage } from '../pages/createConfig/createConfig';
import { Layout } from '../layout/layout';

export const Router: React.FC = () => {
  const Routes: React.FC = () => {
    return useRoutes([
      { path: '*', element: <Navigate to={routes.NOT_FOUND} /> },
      { path: routes.HOME, element: <ConfigsPage /> },
      { path: routes.NOT_FOUND, element: <NotFoundPage /> },
      { path: routes.CONFIG, element: <ConfigsPage /> },
      { path: routes.VIEW_CONFIG, element: <ViewConfigsPage /> },
      { path: routes.CREATE_CONFIG, element: <CreateConfigsPage /> },
      { path: routes.SCHEMA, element: <SchemasPage /> },
      { path: routes.VIEW_SCHEMA, element: <ViewSchemaPage /> },
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
