import React, { useState, useCallback } from 'react';
import { ConfigTable } from './configTable/configTable';
import { Button, Divider, Toolbar, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getConfigs } from '../../api/client/services.gen';
import { Link } from 'react-router-dom';
import { routes } from '../../routing/routes';
import { QueryDataRenderer } from '../../components/queryDataRenderer/queryDataRenderer';
import { PageTitle } from '../../components/pageTitle/pageTitle';

export const ConfigsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const fetchConfigs = useCallback(() => {
    return getConfigs({
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    });
  }, [page, rowsPerPage]);

  const { data, error, isLoading, isSuccess } = useQuery({
    queryKey: ['configs', page, rowsPerPage],
    queryFn: fetchConfigs,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing page size
  };

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
        <ConfigTable
          data={data?.configs ?? []}
          pagination={{
            total: data?.total ?? 0,
            page,
            rowsPerPage,
            onPageChange: handlePageChange,
            onRowsPerPageChange: handleRowsPerPageChange,
          }}
        />
      </QueryDataRenderer>
    </>
  );
};
