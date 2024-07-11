import { BrowserRouter, Navigate, useRoutes } from 'react-router-dom';
import { routes } from './routes';
import { ConfigsPage } from '../pages/configs/configsPage';
import { SchemasPage } from '../pages/schemas/schemas';
import { NotFoundPage } from '../pages/notFound/notFound';
import { ViewSchemaPage } from '../pages/viewSchema/ViewSchemaPage';
import { CreateConfigPage } from '../pages/createConfig/createConfig';
import { Layout } from '../layout/layout';
import { ConfigPage } from '../pages/config/configPage';
import { ConfigFormProvider } from '../context/configContext';

export const Router: React.FC = () => {
  const Routes: React.FC = () => {
    return useRoutes([
      { path: '*', element: <Navigate to={routes.NOT_FOUND} /> },
      { path: routes.HOME, element: <ConfigsPage /> },
      { path: routes.NOT_FOUND, element: <NotFoundPage /> },
      { path: routes.CONFIG, element: <ConfigsPage /> },
      {
        path: routes.CONFIG_INFO,
        element: <ConfigPage />,
        children: [{ path: routes.VIEW_CONFIG }, { path: routes.VIEW_CONFIG_JSON }],
      },
      {
        path: routes.CREATE_CONFIG,
        element: (
          <ConfigFormProvider>
            <CreateConfigPage />
          </ConfigFormProvider>
        ),
      },
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
