import React, { useMemo } from 'react';
import { ConfigTable } from './configTable/configTable';
import { Button, Paper, Toolbar, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getConfigs } from '../../api/client/services.gen';
import { Link } from 'react-router-dom';
import { routes } from '../../routing/routes';
import { QueryWrapper } from '../../components/queryWrapper/queryWrapper';

export const ConfigsPage: React.FC = () => {
  const { data, error, isLoading, isSuccess } = useQuery({ queryKey: ['configs'], queryFn: () => getConfigs() });

  const configData = useMemo(() => data?.configs ?? [], [data]);

  return (
    <QueryWrapper isLoading={isLoading} error={error} isSuccess={isSuccess}>
      <Paper>
        <Toolbar sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography variant="h5">Configs Page</Typography>
        </Toolbar>
        <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary" component={Link} to={routes.CREATE_CONFIG}>
            <Typography sx={{ color: 'white' }}>Create Config</Typography>
          </Button>
        </Toolbar>
        <ConfigTable data={configData} />
      </Paper>
    </QueryWrapper>
  );
};
