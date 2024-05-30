import React from 'react';
import { ConfigTable } from './configTable/configTable';
import { Paper, Toolbar, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getConfigs } from '../../api/client/services.gen';

export const ConfigsPage: React.FC = () => {
  const { data, error } = useQuery({ queryKey: ['configs'], queryFn: () => getConfigs() });

  if (error) {
    console.error(error);
  }

  return (
    <Paper>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h5">Configs Page</Typography>
      </Toolbar>
      <ConfigTable data={data?.configs ?? []} />
    </Paper>
  );
};
