import React from 'react';
import { ConfigTable } from './configTable/configTable';
import { Button, Paper, Toolbar, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getConfigs } from '../../api/client/services.gen';
import { Link } from 'react-router-dom';
import { routes } from '../../routing/routes';

export const ConfigsPage: React.FC = () => {
  const { data, error } = useQuery({ queryKey: ['configs'], queryFn: () => getConfigs() });

  if (error) {
    console.error(error);
  }

  const createText = 'Create Config';

  return (
    <Paper>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h5">Configs Page</Typography>
      </Toolbar>
      <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary">
          <Link to={routes.CREATE_CONFIG}>
            <Typography sx={{ color: 'white' }}>{createText}</Typography>
          </Link>
        </Button>
      </Toolbar>
      <ConfigTable data={data?.configs ?? []} />
    </Paper>
  );
};
