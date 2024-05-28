import React from 'react';
import { ConfigTable } from './configTable/configTable';
import { useQuery } from 'react-query';
import { getConfigs } from '../../api/config/configApi';
import { Paper, Toolbar, Typography } from '@mui/material';

export const ConfigsPage: React.FC = () => {
  const { data } = useQuery({ queryKey: 'configs', queryFn: getConfigs });

  return (
    <Paper>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h5">Configs Page</Typography>
      </Toolbar>
      <ConfigTable data={data?.configs ?? []} />
    </Paper>
  );
};
