import { BrowserRouter, Navigate, useRoutes } from "react-router-dom";
import { routes } from "./routes";
import { ConfigsPage } from "../pages/configPages/configs/configsPage";
import { Layout } from "../layout/layout";
import { SchemasPage } from "../pages/schemaPages/schemas/schemas";

export const Router: React.FC = () => {
  const Routes: React.FC = () => {
    return useRoutes([
      { path: "*", element: <Navigate to={routes.NOT_FOUND} /> },
      { path: routes.CONFIG, element: <ConfigsPage /> },
      { path: routes.SCHEMA, element: <SchemasPage /> },
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
