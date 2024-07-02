import React from 'react';
import { ConfigTable } from './configTable/configTable';
import { Button, Divider, Toolbar, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getConfigs } from '../../api/client/services.gen';
import { Link } from 'react-router-dom';
import { routes } from '../../routing/routes';
import { QueryDataRenderer } from '../../components/queryDataRenderer/queryDataRenderer';
import { PageTitle } from '../../components/pageTitle/pageTitle';

export const ConfigsPage: React.FC = () => {
  const { data, error, isLoading, isSuccess } = useQuery({ queryKey: ['configs'], queryFn: () => getConfigs({ limit: 100 }) });

  return (
    <>
      <PageTitle title="Configs" />
      <QueryDataRenderer isLoading={isLoading} error={error} isSuccess={isSuccess}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'start' }}>
          <Typography variant="h4">Configs</Typography>
        </Toolbar>
        <Divider />
        <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary" component={Link} to={routes.CREATE_CONFIG}>
            <Typography sx={{ color: 'white' }}>Create Config</Typography>
          </Button>
        </Toolbar>
        <ConfigTable data={data?.configs ?? []} />
      </QueryDataRenderer>
    </>
  );
};
