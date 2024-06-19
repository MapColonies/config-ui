import { useQuery } from '@tanstack/react-query';
import NestedTable, { NestedData } from './schemaTree/schemaTree';
import { getSchemasTree } from '../../api/client';
import { Box, Toolbar, Typography } from '@mui/material';

export const SchemasPage: React.FC = () => {
  const { data, isSuccess } = useQuery({ queryKey: ['getSchemasTree'], queryFn: () => getSchemasTree() });

  return (
    <>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h5">Schemas Page</Typography>
      </Toolbar>

      <Box sx={{ overflowY: 'auto', height: '80vh' }}>
        <NestedTable data={isSuccess ? (data as NestedData[]) : []} />
      </Box>
    </>
  );
};
